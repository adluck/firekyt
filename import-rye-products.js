#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importRyeProducts() {
  const csvPath = path.join(__dirname, 'attached_assets', 'product-seed-data_1753048982617.csv');
  
  console.log('🔍 Reading Rye products CSV file...');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  console.log('📄 CSV Headers:', headers);
  console.log('📊 Total lines in CSV:', lines.length - 1);

  // Clear existing products first
  console.log('🧹 Clearing existing Rye products...');
  await pool.query('DELETE FROM rye_products');

  let successCount = 0;
  let errorCount = 0;
  const batchSize = 100;
  let batch = [];

  console.log('📦 Importing products in batches...');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Parse CSV line with proper handling of quoted fields
      const fields = parseCSVLine(line);
      
      if (fields.length < 6) {
        console.warn(`⚠️ Skipping line ${i}: insufficient fields`);
        continue;
      }

      const [id, title, url, price, currencyCode, category, marketplace] = fields;
      
      if (!id || !title || !url) {
        console.warn(`⚠️ Skipping line ${i}: missing required fields`);
        continue;
      }

      // Convert price to number
      const priceValue = price && !isNaN(parseFloat(price)) ? parseFloat(price) : null;

      batch.push({
        id: id.trim(),
        title: title.trim(),
        url: url.trim(),
        price: priceValue,
        currencyCode: (currencyCode || 'USD').trim(),
        category: category ? category.trim() : null,
        marketplace: (marketplace || 'shopify').trim()
      });

      // Process batch when it reaches the batch size
      if (batch.length >= batchSize) {
        await insertBatch(batch);
        successCount += batch.length;
        console.log(`✅ Imported ${successCount} products...`);
        batch = [];
      }

    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing line ${i}:`, error.message);
      if (errorCount > 10) {
        console.error('Too many errors, stopping import');
        break;
      }
    }
  }

  // Process remaining batch
  if (batch.length > 0) {
    await insertBatch(batch);
    successCount += batch.length;
  }

  console.log('🎉 Import completed!');
  console.log(`✅ Successfully imported: ${successCount} products`);
  console.log(`❌ Errors: ${errorCount}`);
  
  // Verify the import
  const result = await pool.query('SELECT COUNT(*) as count FROM rye_products');
  console.log(`📊 Total products in database: ${result.rows[0].count}`);
  
  pool.end();
}

async function insertBatch(products) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const product of products) {
      await client.query(
        `INSERT INTO rye_products (id, title, url, price, currency_code, category, marketplace) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         url = EXCLUDED.url,
         price = EXCLUDED.price,
         currency_code = EXCLUDED.currency_code,
         category = EXCLUDED.category,
         marketplace = EXCLUDED.marketplace,
         updated_at = now()`,
        [product.id, product.title, product.url, product.price, product.currencyCode, product.category, product.marketplace]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  fields.push(current);
  
  return fields;
}

// Run the import
importRyeProducts().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
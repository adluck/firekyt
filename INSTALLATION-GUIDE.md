# FireKyt Widget Plugin - Quick Installation Guide

## 📦 What You're Installing

The **FireKyt Widget Embedder** plugin allows you to safely embed affiliate widgets in your WordPress posts and pages without editing code or dealing with security restrictions.

## 🚀 Simple Installation (3 Steps)

### Step 1: Download the Plugin
1. Save the plugin files to your computer
2. If you have individual files, create a folder called `firekyt-widget-plugin`
3. Place all files inside this folder

### Step 2: Upload to WordPress
**Option A: WordPress Admin (Easiest)**
1. Go to your WordPress admin area
2. Click **Plugins → Add New → Upload Plugin**
3. Choose the plugin zip file or upload the folder
4. Click **Install Now**

**Option B: FTP Upload**
1. Connect to your website via FTP
2. Navigate to `/wp-content/plugins/`
3. Upload the `firekyt-widget-plugin` folder here

### Step 3: Activate & Configure
1. Go to **Plugins** in your WordPress admin
2. Find "FireKyt Widget Embedder" and click **Activate**
3. Go to **Settings → FireKyt Widgets** to configure

## ⚙️ Quick Setup

### Configure Allowed Domains
The plugin comes pre-configured with FireKyt domains, but you can add your own:

1. Go to **Settings → FireKyt Widgets**
2. In "Allowed Domains", add your domain like this:
   ```
   firekyt.com,*.firekyt.com,yourdomain.com,localhost:5000
   ```
3. Click **Save Changes**

### Set Default Sizes
- **Default Width**: 300 pixels (good for sidebars)
- **Default Height**: 250 pixels (medium rectangle)
- **Lazy Loading**: Keep enabled for better performance

## 🎯 Start Using Widgets

### Method 1: Shortcode (Any Editor)
Copy and paste this shortcode into any post or page:

```
[firekyt_widget id="YOUR_WIDGET_ID" domain="YOUR_DOMAIN.COM"]
```

Replace:
- `YOUR_WIDGET_ID` with your actual widget ID (like "123")
- `YOUR_DOMAIN.COM` with your actual domain

### Method 2: Gutenberg Blocks (Modern Editor)
1. Edit a post or page
2. Click the **+** button to add a block
3. Search for "FireKyt Widget"
4. Enter your Widget ID and Domain in the sidebar
5. See instant preview

### Method 3: Classic Editor
1. Switch to **Text** view (not Visual)
2. Paste your shortcode where you want the widget
3. Switch back to **Visual** to see preview

## 🛠️ Troubleshooting

### Widget Shows Error Message
**Problem**: "Domain not in allowed list"
**Solution**: Add your domain to the allowed list in Settings

**Problem**: "Widget ID required"
**Solution**: Make sure you included both `id` and `domain` in your shortcode

### Widget Not Displaying
**Check These:**
1. Plugin is activated
2. Your domain is in the allowed domains list
3. Widget ID is correct
4. You're using the correct shortcode format

### Gutenberg Block Not Working
**Solutions:**
1. Clear your browser cache (Ctrl+F5)
2. Make sure WordPress is version 5.0 or higher
3. Check if other plugins are conflicting

## 📱 Mobile & Responsive

The plugin automatically makes widgets mobile-friendly:
- Widgets resize for mobile screens
- Touch-friendly interactions
- Maintains aspect ratios
- No extra setup needed

## 🔒 Security Features

The plugin includes built-in security:
- Only approved domains can be embedded
- XSS protection
- Safe iframe attributes
- WordPress security integration

## 🎨 Styling & Customization

### Basic Styling
Widgets get the CSS class `firekyt-widget-iframe`. Add custom styles to your theme:

```css
.firekyt-widget-iframe {
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
```

### Custom Sizes
Override default sizes in your shortcode:

```
[firekyt_widget id="123" domain="mysite.com" width="728" height="90"]
```

## 🔄 Updates

The plugin will notify you of updates automatically. Simply:
1. Go to **Plugins** in WordPress admin
2. Click **Update** when available
3. Your settings are preserved

## 🗑️ Removing the Plugin

If you ever need to remove it:
1. Go to **Plugins** in WordPress admin
2. Deactivate "FireKyt Widget Embedder"
3. Click **Delete**
4. All settings are automatically cleaned up

## 📞 Need Help?

### Quick Fixes
- **Clear browser cache** (solves 80% of issues)
- **Check plugin conflicts** (deactivate other plugins temporarily)
- **Verify widget ID and domain** (most common mistake)

### Get Support
- Email: support@firekyt.com
- Documentation: docs.firekyt.com
- Community: community.firekyt.com

## ✅ Success Checklist

After installation, you should be able to:
- [ ] See "FireKyt Widget Embedder" in your plugins list
- [ ] Access **Settings → FireKyt Widgets**
- [ ] Add a FireKyt Widget block in Gutenberg
- [ ] Use shortcodes in posts/pages
- [ ] See widget previews in the editor

---

**That's it!** You're ready to start embedding affiliate widgets and earning commissions. The plugin handles all the technical security stuff so you can focus on creating great content.
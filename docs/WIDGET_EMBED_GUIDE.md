# Widget Embed Guide

## Overview

FireKyt's Dynamic Affiliate Ads Widget System allows you to create professional advertisement widgets and embed them directly into your blog posts, websites, and content. This guide covers everything you need to know about using widget embed codes effectively.

## What Are Affiliate Ad Widgets?

Affiliate ad widgets are customizable advertisement units that you can embed anywhere on your website or blog. They're designed to:

- **Generate Revenue**: Monetize your content with affiliate links
- **Look Professional**: Blend seamlessly with your content design
- **Track Performance**: Monitor clicks, conversions, and earnings
- **Save Time**: Create once, use everywhere

## Creating Your First Widget

### Step 1: Access Widget Creation
1. Navigate to **Ads Widgets** → **Create Widget** in your FireKyt dashboard
2. Choose your widget name and description
3. Select the appropriate ad size for your use case

### Step 2: Configure Your Ads
1. **Add Products**: Click "Add Advertisement" to include affiliate products
2. **Set Details**: Add product name, description, and affiliate URL
3. **Upload Images**: Include high-quality product images
4. **Configure Rotation**: Set how often ads rotate (10s recommended)

### Step 3: Choose Design Template
Select from professional templates:
- **Modern Gradient**: Sleek gradient backgrounds
- **Professional Dark**: Clean dark theme design
- **Minimal White**: Simple, clean appearance
- **Vibrant Orange**: Eye-catching bright design
- **E-commerce Classic**: Traditional shopping layout

### Step 4: Customize Appearance
- **Colors**: Customize background, text, and button colors
- **Sizing**: Adjust image scale and fit options
- **Layout**: Fine-tune spacing and alignment

## Embed Code Usage

### Getting Your Embed Code
1. Complete your widget setup
2. Click the **"Embed Code"** tab in the Live Preview section
3. Copy the generated HTML/JavaScript code
4. Paste it into your blog post or website

### Supported Platforms

#### WordPress Blogs
```html
<!-- Switch to HTML/Code editor and paste embed code -->
<div id="firekyt-widget-123"></div>
<script src="https://your-domain.com/widget/123.js"></script>
```

#### Ghost Blogs
```html
<!-- Use HTML card or code injection -->
<div class="firekyt-affiliate-widget">
  <!-- Embed code goes here -->
</div>
```

#### Medium Articles
- Use embedded content blocks
- Paste widget URL for automatic rendering
- Ensure compliance with Medium's affiliate link policies

#### Custom Websites
```html
<!-- Add anywhere in your HTML -->
<article>
  <h2>Product Recommendations</h2>
  <!-- Widget embed code -->
  <div id="firekyt-widget-123"></div>
  <script src="https://your-domain.com/widget/123.js"></script>
</article>
```

## Widget Sizes and Use Cases

### 728x90 Leaderboard
- **Best For**: Header/footer placement, blog post headers
- **Layout**: Horizontal product showcase
- **Ideal Content**: 2-3 products with prominent buy buttons

### 300x250 Medium Rectangle
- **Best For**: Sidebar placement, in-content advertising
- **Layout**: Balanced square format
- **Ideal Content**: Single product focus with detailed description

### 160x600 Wide Skyscraper
- **Best For**: Sidebar placement on desktop sites
- **Layout**: Vertical product stack
- **Ideal Content**: Multiple products in compact format

### 320x50 Mobile Banner
- **Best For**: Mobile-optimized content
- **Layout**: Compact horizontal design
- **Ideal Content**: Single product with minimal text

## Performance Optimization

### Best Practices
1. **Strategic Placement**: Position widgets where readers naturally pause
2. **Content Relevance**: Match widget products to article topics
3. **Load Speed**: Widgets are optimized for fast loading
4. **Mobile Responsive**: All widgets automatically adapt to screen size

### Analytics Integration
- **Click Tracking**: Monitor which products get the most clicks
- **Conversion Tracking**: See which widgets generate revenue
- **Performance Metrics**: Track impressions, CTR, and earnings
- **A/B Testing**: Compare different widget designs and placements

## Advanced Features

### Automatic Content Rotation
- Products rotate automatically every 10 seconds
- Keeps content fresh for repeat visitors
- Increases exposure for all your affiliate products

### UTM Parameter Tracking
- Automatic UTM parameter generation
- Track traffic sources and campaign performance
- Integrate with Google Analytics

### Responsive Design
- Widgets automatically adapt to container width
- Mobile-optimized layouts
- Retina display support

## Technical Implementation

### Embed Code Structure
```html
<!-- Container div with unique ID -->
<div id="firekyt-widget-[WIDGET_ID]" class="firekyt-affiliate-widget">
  <!-- Widget content loads here -->
</div>

<!-- JavaScript for widget functionality -->
<script>
  (function() {
    // Widget initialization code
    var widget = document.createElement('script');
    widget.src = 'https://firekyt.com/widgets/[WIDGET_ID].js';
    widget.async = true;
    document.head.appendChild(widget);
  })();
</script>
```

### CSS Customization
```css
/* Override widget styles if needed */
.firekyt-affiliate-widget {
  margin: 20px 0;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```

## Compliance and Legal

### Affiliate Disclosure
- Always include proper affiliate link disclosures
- Follow FTC guidelines for affiliate marketing
- Clearly label sponsored content

### Platform Policies
- **WordPress**: Follow WordPress.com monetization policies
- **Medium**: Comply with Medium's affiliate link guidelines
- **Ghost**: Check hosting provider's advertising policies
- **YouTube**: Include proper disclosures in video descriptions

## Troubleshooting

### Common Issues

#### Widget Not Displaying
1. Check if JavaScript is enabled in browser
2. Verify embed code is correctly pasted
3. Ensure no ad blockers are interfering
4. Check console for JavaScript errors

#### Slow Loading
1. Widgets are optimized for speed
2. Check your website's overall performance
3. Consider lazy loading for below-fold widgets

#### Mobile Display Issues
1. All widgets are responsive by default
2. Test on various device sizes
3. Ensure container has proper width

### Support Resources
- **Documentation**: Complete guides and tutorials
- **Video Tutorials**: Step-by-step visual guides
- **Community Forum**: Connect with other FireKyt users
- **Support Team**: Direct help for technical issues

## Examples and Templates

### Blog Post Integration
```html
<article>
  <h1>Best Gaming Headsets 2025</h1>
  <p>After extensive testing, here are our top recommendations...</p>
  
  <!-- Widget placement after introduction -->
  <div id="firekyt-widget-gaming-headsets"></div>
  <script src="https://firekyt.com/widgets/gaming-headsets.js"></script>
  
  <h2>Detailed Reviews</h2>
  <p>Let's dive into each product...</p>
</article>
```

### Sidebar Widget
```html
<aside class="sidebar">
  <h3>Recommended Products</h3>
  <!-- Vertical widget for sidebar -->
  <div id="firekyt-widget-recommendations"></div>
  <script src="https://firekyt.com/widgets/recommendations.js"></script>
</aside>
```

## Monetization Strategy

### Revenue Optimization
1. **Content Matching**: Align widget products with article topics
2. **Strategic Timing**: Place widgets where readers are most engaged
3. **Testing**: Experiment with different designs and placements
4. **Analytics**: Use performance data to optimize placement

### Scaling Your Income
- Create multiple widgets for different niches
- Use analytics to identify top-performing products
- Optimize widget placement based on user behavior
- Expand to multiple content platforms

---

*For additional support or questions about widget embedding, visit our [Support Center](support.firekyt.com) or contact our team directly.*
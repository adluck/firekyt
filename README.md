# FireKyt Widget Embedder - WordPress Plugin

A secure and user-friendly WordPress plugin that enables safe embedding of FireKyt affiliate widgets and external iframes without manual code editing.

## 🚀 Features

### Core Functionality
- **Automatic iframe Support**: Safely allows `<iframe>` tags in post/page content
- **Dual Shortcode System**: Specialized shortcodes for FireKyt widgets and generic iframes
- **Security First**: Domain whitelist system with wildcard support
- **Gutenberg Integration**: Native block editor support with live previews
- **Mobile Responsive**: Automatic responsive adjustments for all screen sizes
- **Performance Optimized**: Lazy loading and performance-first design

### WordPress Compatibility
- ✅ **Classic Editor**: Full TinyMCE integration
- ✅ **Gutenberg Editor**: Custom blocks with live preview
- ✅ **Page Builders**: Compatible with Elementor, Beaver Builder, Divi
- ✅ **WordPress 5.0+**: Tested with latest WordPress versions
- ✅ **Multisite**: Full multisite network support

## 📦 Installation

### Method 1: Direct Upload (Recommended)
1. Download the plugin files from your FireKyt dashboard
2. Go to **WordPress Admin → Plugins → Add New → Upload Plugin**
3. Upload the `firekyt-widget-plugin.zip` file
4. Click **Install Now** and then **Activate**

### Method 2: Manual Installation
1. Upload the `firekyt-widget-plugin` folder to `/wp-content/plugins/`
2. Go to **WordPress Admin → Plugins**
3. Find "FireKyt Widget Embedder" and click **Activate**

### Method 3: FTP Upload
1. Extract the plugin files to your computer
2. Upload the entire folder to `/wp-content/plugins/` via FTP
3. Activate through the WordPress admin interface

## ⚙️ Configuration

### Initial Setup
1. Go to **Settings → FireKyt Widgets** in your WordPress admin
2. Configure your allowed domains (default includes FireKyt domains)
3. Set default widget dimensions
4. Save your settings

### Allowed Domains
The plugin includes these pre-configured safe domains:
- `firekyt.com`
- `*.firekyt.com` (all subdomains)
- `localhost:5000` (development)
- `*.replit.app` (Replit deployments)

Add your custom domains in the format:
```
mydomain.com,*.anotherdomain.com,specific.subdomain.com
```

## 🎯 Usage Guide

### FireKyt Widget Shortcode
For embedding FireKyt affiliate widgets:

```php
[firekyt_widget id="123" domain="myapp.com" width="300" height="250"]
```

**Parameters:**
- `id` (required) - Your FireKyt widget ID
- `domain` (required) - Domain hosting your widget
- `width` (optional) - Width in pixels (default: 300)
- `height` (optional) - Height in pixels (default: 250)
- `loading` (optional) - "lazy" or "eager" (default: lazy)
- `class` (optional) - CSS class name

### Generic Iframe Shortcode
For other external content:

```php
[firekyt_iframe src="https://example.com/widget" width="300" height="250" title="My Widget"]
```

**Parameters:**
- `src` (required) - Full URL to embed
- `width` (optional) - Width in pixels
- `height` (optional) - Height in pixels
- `title` (optional) - Accessible title
- `loading` (optional) - "lazy" or "eager"
- `class` (optional) - CSS class name

## 🎨 Gutenberg Blocks

### FireKyt Widget Block
1. In Gutenberg editor, click **+** to add a block
2. Search for "FireKyt Widget"
3. Enter your Widget ID and Domain in the sidebar
4. Adjust dimensions as needed
5. See live preview in the editor

### Safe Iframe Embed Block
1. Add block and search for "Safe Iframe Embed"
2. Enter the source URL in the sidebar
3. Configure dimensions and accessibility options
4. Preview updates automatically

## 🛡️ Security Features

### Domain Whitelisting
- Only approved domains can be embedded
- Wildcard support for subdomains
- Automatic validation before rendering

### Sandboxing
- Secure iframe attributes applied automatically
- XSS protection through content filtering
- Safe default configurations

### WordPress Security
- Integrates with WordPress security standards
- Respects user capabilities and permissions
- Clean uninstall process

## 🎛️ Advanced Configuration

### Custom CSS Classes
Default class: `firekyt-widget-iframe`

Add custom styling in your theme:
```css
.firekyt-widget-iframe {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Theme Integration
The plugin respects your theme's styling and provides hooks for customization:

```php
// Add to your theme's functions.php
add_filter('firekyt_widget_default_class', function($class) {
    return 'my-custom-widget-class';
});
```

### Performance Optimization
- Lazy loading enabled by default
- Optimized CSS and JavaScript loading
- Minimal resource footprint

## 🔧 Troubleshooting

### Widget Not Displaying
1. **Check Domain Whitelist**: Ensure your domain is in the allowed list
2. **Verify Widget ID**: Double-check your FireKyt widget ID
3. **Browser Console**: Look for JavaScript errors
4. **Theme Conflicts**: Test with a default WordPress theme

### Gutenberg Issues
1. **Clear Browser Cache**: Force refresh with Ctrl+F5
2. **Plugin Conflicts**: Temporarily deactivate other plugins
3. **WordPress Update**: Ensure you're using WordPress 5.0+

### Permission Errors
1. **User Capabilities**: Ensure you have `edit_posts` capability
2. **Multisite**: Check network admin settings
3. **Security Plugins**: Whitelist iframe tags in security plugins

## 📱 Mobile Compatibility

The plugin automatically:
- Scales widgets for mobile screens
- Applies responsive CSS rules
- Maintains aspect ratios
- Optimizes touch interactions

## 🔄 Updates & Maintenance

### Automatic Updates
- The plugin checks for updates from your FireKyt dashboard
- Security patches applied automatically
- Feature updates with user notification

### Manual Updates
1. Download latest version from FireKyt
2. Upload and replace existing files
3. Reactivate if needed

## 🗑️ Uninstallation

### Clean Removal
1. Deactivate the plugin
2. Delete from **Plugins → Installed Plugins**
3. All settings and data are automatically removed

### Manual Cleanup
If needed, remove these database options:
- `firekyt_widget_options`

## 📞 Support

### Documentation
- [FireKyt Widget Documentation](https://docs.firekyt.com)
- [WordPress Plugin Guide](https://firekyt.com/wordpress-guide)

### Contact Support
- **Email**: support@firekyt.com
- **Live Chat**: Available in your FireKyt dashboard
- **Community Forum**: [community.firekyt.com](https://community.firekyt.com)

## 📋 System Requirements

- **WordPress**: 5.0 or higher
- **PHP**: 7.4 or higher
- **Memory**: 64MB minimum
- **Permissions**: File write access for uploads

## 🔐 Privacy & Data

### Data Collection
- No personal data collected
- Widget analytics handled by FireKyt servers
- GDPR compliant

### Third-Party Services
- Widget content loaded from approved domains only
- No tracking scripts without user consent
- Respects WordPress privacy settings

## 📄 License

This plugin is licensed under GPL v2 or later.
Copyright © 2025 FireKyt. All rights reserved.

## 🚀 Getting Started

1. **Install** the plugin using any method above
2. **Configure** your allowed domains in Settings
3. **Create** a FireKyt widget in your dashboard
4. **Embed** using shortcodes or Gutenberg blocks
5. **Publish** and start earning affiliate commissions!

---

**Need help?** Visit [docs.firekyt.com](https://docs.firekyt.com) for detailed guides and video tutorials.
<?php
/**
 * Plugin Name: FireKyt Widget Embedder
 * Plugin URI: https://firekyt.com
 * Description: Safely embed FireKyt affiliate widgets and external iframes with shortcodes. Automatically allows iframe tags and provides easy embedding options.
 * Version: 1.0.0
 * Author: FireKyt
 * Author URI: https://firekyt.com
 * License: GPL v2 or later
 * Text Domain: firekyt-widget
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('FIREKYT_WIDGET_VERSION', '1.0.0');
define('FIREKYT_WIDGET_PLUGIN_URL', plugin_dir_url(__FILE__));
define('FIREKYT_WIDGET_PLUGIN_PATH', plugin_dir_path(__FILE__));

/**
 * Main FireKyt Widget Plugin Class
 */
class FireKytWidgetPlugin {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Initialize the plugin
     */
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('firekyt-widget', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        // Initialize components
        $this->setup_iframe_support();
        $this->register_shortcodes();
        $this->setup_admin();
        $this->enqueue_scripts();
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options
        if (!get_option('firekyt_widget_options')) {
            $defaults = array(
                'allowed_domains' => 'firekyt.com,*.firekyt.com,localhost:5000,*.replit.app',
                'default_width' => '300',
                'default_height' => '250',
                'lazy_loading' => 'yes',
                'sandbox_attributes' => 'allow-scripts allow-same-origin allow-popups allow-forms',
                'css_classes' => 'firekyt-widget-iframe'
            );
            add_option('firekyt_widget_options', $defaults);
        }
        
        // Clear any cached content
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear any cached content
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
    }
    
    /**
     * Setup iframe support in WordPress
     */
    public function setup_iframe_support() {
        // Allow iframe tags in post content
        add_filter('wp_kses_allowed_html', array($this, 'allow_iframe_tags'), 10, 2);
        
        // Allow iframe attributes in TinyMCE
        add_filter('tiny_mce_before_init', array($this, 'allow_iframe_tinymce'));
        
        // Add iframe support to Gutenberg
        add_action('enqueue_block_editor_assets', array($this, 'gutenberg_iframe_support'));
    }
    
    /**
     * Allow iframe tags in wp_kses
     */
    public function allow_iframe_tags($tags, $context) {
        if ($context === 'post') {
            $tags['iframe'] = array(
                'src' => true,
                'width' => true,
                'height' => true,
                'frameborder' => true,
                'marginwidth' => true,
                'marginheight' => true,
                'scrolling' => true,
                'title' => true,
                'class' => true,
                'id' => true,
                'style' => true,
                'loading' => true,
                'sandbox' => true,
                'allow' => true,
                'allowfullscreen' => true,
                'data-*' => true
            );
        }
        return $tags;
    }
    
    /**
     * Allow iframe in TinyMCE editor
     */
    public function allow_iframe_tinymce($init) {
        if (isset($init['extended_valid_elements'])) {
            $init['extended_valid_elements'] .= ',iframe[src|width|height|frameborder|marginwidth|marginheight|scrolling|title|class|id|style|loading|sandbox|allow|allowfullscreen]';
        } else {
            $init['extended_valid_elements'] = 'iframe[src|width|height|frameborder|marginwidth|marginheight|scrolling|title|class|id|style|loading|sandbox|allow|allowfullscreen]';
        }
        return $init;
    }
    
    /**
     * Add Gutenberg support
     */
    public function gutenberg_iframe_support() {
        wp_enqueue_script(
            'firekyt-widget-gutenberg',
            FIREKYT_WIDGET_PLUGIN_URL . 'assets/gutenberg-support.js',
            array('wp-blocks', 'wp-element', 'wp-editor'),
            FIREKYT_WIDGET_VERSION,
            true
        );
    }
    
    /**
     * Register shortcodes
     */
    public function register_shortcodes() {
        add_shortcode('firekyt_widget', array($this, 'widget_shortcode'));
        add_shortcode('firekyt_iframe', array($this, 'iframe_shortcode'));
    }
    
    /**
     * FireKyt Widget Shortcode
     * Usage: [firekyt_widget id="123" domain="myapp.com" width="300" height="250"]
     */
    public function widget_shortcode($atts) {
        $defaults = $this->get_plugin_options();
        
        $atts = shortcode_atts(array(
            'id' => '',
            'domain' => '',
            'width' => $defaults['default_width'],
            'height' => $defaults['default_height'],
            'class' => $defaults['css_classes'],
            'loading' => $defaults['lazy_loading'] === 'yes' ? 'lazy' : 'eager',
            'sandbox' => $defaults['sandbox_attributes']
        ), $atts, 'firekyt_widget');
        
        // Validate required parameters
        if (empty($atts['id']) || empty($atts['domain'])) {
            return '<div class="firekyt-widget-error">Error: Widget ID and domain are required for FireKyt widgets.</div>';
        }
        
        // Validate domain
        if (!$this->is_domain_allowed($atts['domain'])) {
            return '<div class="firekyt-widget-error">Error: Domain not in allowed list for security.</div>';
        }
        
        // Sanitize inputs
        $widget_id = sanitize_text_field($atts['id']);
        $domain = sanitize_text_field($atts['domain']);
        $width = intval($atts['width']);
        $height = intval($atts['height']);
        $class = sanitize_html_class($atts['class']);
        $loading = in_array($atts['loading'], array('lazy', 'eager')) ? $atts['loading'] : 'lazy';
        
        // Build iframe URL
        $protocol = is_ssl() ? 'https' : 'http';
        $src = "{$protocol}://{$domain}/widgets/{$widget_id}/iframe";
        
        // Build iframe HTML
        $iframe_html = sprintf(
            '<iframe src="%s" width="%d" height="%d" frameborder="0" scrolling="no" loading="%s" class="%s" title="FireKyt Affiliate Widget" sandbox="%s" style="border: none; display: block; max-width: 100%%;"></iframe>',
            esc_url($src),
            $width,
            $height,
            esc_attr($loading),
            esc_attr($class),
            esc_attr($atts['sandbox'])
        );
        
        return $iframe_html;
    }
    
    /**
     * Generic iframe shortcode
     * Usage: [firekyt_iframe src="https://example.com/widget" width="300" height="250"]
     */
    public function iframe_shortcode($atts) {
        $defaults = $this->get_plugin_options();
        
        $atts = shortcode_atts(array(
            'src' => '',
            'width' => $defaults['default_width'],
            'height' => $defaults['default_height'],
            'class' => $defaults['css_classes'],
            'loading' => $defaults['lazy_loading'] === 'yes' ? 'lazy' : 'eager',
            'sandbox' => $defaults['sandbox_attributes'],
            'title' => 'External Content'
        ), $atts, 'firekyt_iframe');
        
        // Validate required parameters
        if (empty($atts['src'])) {
            return '<div class="firekyt-widget-error">Error: src attribute is required for iframe.</div>';
        }
        
        // Validate domain
        $domain = parse_url($atts['src'], PHP_URL_HOST);
        if (!$this->is_domain_allowed($domain)) {
            return '<div class="firekyt-widget-error">Error: Domain not in allowed list for security.</div>';
        }
        
        // Sanitize inputs
        $src = esc_url($atts['src']);
        $width = intval($atts['width']);
        $height = intval($atts['height']);
        $class = sanitize_html_class($atts['class']);
        $loading = in_array($atts['loading'], array('lazy', 'eager')) ? $atts['loading'] : 'lazy';
        $title = sanitize_text_field($atts['title']);
        
        // Build iframe HTML
        $iframe_html = sprintf(
            '<iframe src="%s" width="%d" height="%d" frameborder="0" scrolling="no" loading="%s" class="%s" title="%s" sandbox="%s" style="border: none; display: block; max-width: 100%%;"></iframe>',
            $src,
            $width,
            $height,
            esc_attr($loading),
            esc_attr($class),
            esc_attr($title),
            esc_attr($atts['sandbox'])
        );
        
        return $iframe_html;
    }
    
    /**
     * Check if domain is allowed
     */
    private function is_domain_allowed($domain) {
        $options = $this->get_plugin_options();
        $allowed_domains = explode(',', $options['allowed_domains']);
        
        foreach ($allowed_domains as $allowed) {
            $allowed = trim($allowed);
            // Support wildcard domains
            if (strpos($allowed, '*') !== false) {
                $pattern = str_replace('*', '.*', $allowed);
                if (preg_match('/^' . $pattern . '$/', $domain)) {
                    return true;
                }
            } else {
                if ($domain === $allowed) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Setup admin interface
     */
    public function setup_admin() {
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
        }
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('FireKyt Widget Settings', 'firekyt-widget'),
            __('FireKyt Widgets', 'firekyt-widget'),
            'manage_options',
            'firekyt-widget-settings',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('firekyt_widget_options', 'firekyt_widget_options', array($this, 'sanitize_options'));
        
        add_settings_section(
            'firekyt_widget_general',
            __('General Settings', 'firekyt-widget'),
            array($this, 'settings_section_callback'),
            'firekyt-widget-settings'
        );
        
        add_settings_field(
            'allowed_domains',
            __('Allowed Domains', 'firekyt-widget'),
            array($this, 'allowed_domains_callback'),
            'firekyt-widget-settings',
            'firekyt_widget_general'
        );
        
        add_settings_field(
            'default_width',
            __('Default Width', 'firekyt-widget'),
            array($this, 'default_width_callback'),
            'firekyt-widget-settings',
            'firekyt_widget_general'
        );
        
        add_settings_field(
            'default_height',
            __('Default Height', 'firekyt-widget'),
            array($this, 'default_height_callback'),
            'firekyt-widget-settings',
            'firekyt_widget_general'
        );
        
        add_settings_field(
            'lazy_loading',
            __('Lazy Loading', 'firekyt-widget'),
            array($this, 'lazy_loading_callback'),
            'firekyt-widget-settings',
            'firekyt_widget_general'
        );
    }
    
    /**
     * Settings section callback
     */
    public function settings_section_callback() {
        echo '<p>' . __('Configure default settings for FireKyt widgets and iframe embedding.', 'firekyt-widget') . '</p>';
    }
    
    /**
     * Allowed domains field
     */
    public function allowed_domains_callback() {
        $options = $this->get_plugin_options();
        echo '<textarea name="firekyt_widget_options[allowed_domains]" rows="3" cols="50" class="regular-text">' . esc_textarea($options['allowed_domains']) . '</textarea>';
        echo '<p class="description">' . __('Comma-separated list of allowed domains. Use * for wildcards (e.g., *.firekyt.com)', 'firekyt-widget') . '</p>';
    }
    
    /**
     * Default width field
     */
    public function default_width_callback() {
        $options = $this->get_plugin_options();
        echo '<input type="number" name="firekyt_widget_options[default_width]" value="' . esc_attr($options['default_width']) . '" min="100" max="2000" />';
        echo '<p class="description">' . __('Default width for widgets (in pixels)', 'firekyt-widget') . '</p>';
    }
    
    /**
     * Default height field
     */
    public function default_height_callback() {
        $options = $this->get_plugin_options();
        echo '<input type="number" name="firekyt_widget_options[default_height]" value="' . esc_attr($options['default_height']) . '" min="100" max="2000" />';
        echo '<p class="description">' . __('Default height for widgets (in pixels)', 'firekyt-widget') . '</p>';
    }
    
    /**
     * Lazy loading field
     */
    public function lazy_loading_callback() {
        $options = $this->get_plugin_options();
        echo '<select name="firekyt_widget_options[lazy_loading]">';
        echo '<option value="yes"' . selected($options['lazy_loading'], 'yes', false) . '>' . __('Yes', 'firekyt-widget') . '</option>';
        echo '<option value="no"' . selected($options['lazy_loading'], 'no', false) . '>' . __('No', 'firekyt-widget') . '</option>';
        echo '</select>';
        echo '<p class="description">' . __('Enable lazy loading for better performance', 'firekyt-widget') . '</p>';
    }
    
    /**
     * Admin page
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <div class="notice notice-info">
                <p><strong><?php _e('FireKyt Widget Embedder', 'firekyt-widget'); ?></strong></p>
                <p><?php _e('This plugin allows you to safely embed FireKyt affiliate widgets and other external iframes in your posts and pages.', 'firekyt-widget'); ?></p>
            </div>
            
            <div class="postbox" style="margin-top: 20px;">
                <div class="postbox-header">
                    <h2><?php _e('How to Use', 'firekyt-widget'); ?></h2>
                </div>
                <div class="inside">
                    <h3><?php _e('FireKyt Widget Shortcode', 'firekyt-widget'); ?></h3>
                    <p><?php _e('Use this shortcode to embed FireKyt affiliate widgets:', 'firekyt-widget'); ?></p>
                    <code>[firekyt_widget id="123" domain="myapp.com" width="300" height="250"]</code>
                    
                    <h3><?php _e('Generic Iframe Shortcode', 'firekyt-widget'); ?></h3>
                    <p><?php _e('Use this shortcode for other external iframes:', 'firekyt-widget'); ?></p>
                    <code>[firekyt_iframe src="https://example.com/widget" width="300" height="250"]</code>
                    
                    <h3><?php _e('Available Parameters', 'firekyt-widget'); ?></h3>
                    <ul>
                        <li><strong>id</strong> - Widget ID (FireKyt widgets only)</li>
                        <li><strong>domain</strong> - Domain hosting the widget (FireKyt widgets only)</li>
                        <li><strong>src</strong> - Full URL to iframe content (generic iframe only)</li>
                        <li><strong>width</strong> - Width in pixels (optional)</li>
                        <li><strong>height</strong> - Height in pixels (optional)</li>
                        <li><strong>class</strong> - CSS class name (optional)</li>
                        <li><strong>loading</strong> - lazy or eager (optional)</li>
                    </ul>
                </div>
            </div>
            
            <form action="options.php" method="post">
                <?php
                settings_fields('firekyt_widget_options');
                do_settings_sections('firekyt-widget-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Sanitize options
     */
    public function sanitize_options($input) {
        $sanitized = array();
        
        if (isset($input['allowed_domains'])) {
            $sanitized['allowed_domains'] = sanitize_textarea_field($input['allowed_domains']);
        }
        
        if (isset($input['default_width'])) {
            $sanitized['default_width'] = absint($input['default_width']);
        }
        
        if (isset($input['default_height'])) {
            $sanitized['default_height'] = absint($input['default_height']);
        }
        
        if (isset($input['lazy_loading'])) {
            $sanitized['lazy_loading'] = in_array($input['lazy_loading'], array('yes', 'no')) ? $input['lazy_loading'] : 'yes';
        }
        
        // Preserve other options
        $existing = $this->get_plugin_options();
        return array_merge($existing, $sanitized);
    }
    
    /**
     * Get plugin options
     */
    private function get_plugin_options() {
        $defaults = array(
            'allowed_domains' => 'firekyt.com,*.firekyt.com,localhost:5000,*.replit.app',
            'default_width' => '300',
            'default_height' => '250',
            'lazy_loading' => 'yes',
            'sandbox_attributes' => 'allow-scripts allow-same-origin allow-popups allow-forms',
            'css_classes' => 'firekyt-widget-iframe'
        );
        
        return wp_parse_args(get_option('firekyt_widget_options', array()), $defaults);
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        add_action('wp_enqueue_scripts', array($this, 'frontend_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_scripts'));
    }
    
    /**
     * Frontend scripts
     */
    public function frontend_scripts() {
        wp_enqueue_style(
            'firekyt-widget-frontend',
            FIREKYT_WIDGET_PLUGIN_URL . 'assets/frontend.css',
            array(),
            FIREKYT_WIDGET_VERSION
        );
    }
    
    /**
     * Admin scripts
     */
    public function admin_scripts($hook) {
        if ($hook === 'settings_page_firekyt-widget-settings') {
            wp_enqueue_style(
                'firekyt-widget-admin',
                FIREKYT_WIDGET_PLUGIN_URL . 'assets/admin.css',
                array(),
                FIREKYT_WIDGET_VERSION
            );
        }
    }
}

// Initialize the plugin
new FireKytWidgetPlugin();

// Add uninstall hook
register_uninstall_hook(__FILE__, 'firekyt_widget_uninstall');

/**
 * Uninstall function
 */
function firekyt_widget_uninstall() {
    delete_option('firekyt_widget_options');
    
    // Clear any cached content
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
}
<?php
/**
 * Plugin Name: FireKyt Widget Embed
 * Description: Enables secure embedding of FireKyt affiliate widgets in WordPress posts and pages
 * Version: 1.0
 * Author: FireKyt
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Add iframe support to WordPress KSES
function firekyt_allow_iframe_embeds($allowedtags) {
    $allowedtags['iframe'] = array(
        'src' => true,
        'width' => true,
        'height' => true,
        'frameborder' => true,
        'scrolling' => true,
        'style' => true,
        'class' => true,
        'id' => true,
        'title' => true,
        'allowfullscreen' => true
    );
    return $allowedtags;
}
add_filter('wp_kses_allowed_html', 'firekyt_allow_iframe_embeds');

// Add shortcode support for FireKyt widgets
function firekyt_widget_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'width' => '728',
        'height' => '90',
        'domain' => ''
    ), $atts);
    
    if (empty($atts['id']) || empty($atts['domain'])) {
        return '<p><strong>FireKyt Widget Error:</strong> Widget ID and domain are required.</p>';
    }
    
    $iframe_url = esc_url($atts['domain'] . '/widgets/' . $atts['id'] . '/iframe');
    $width = esc_attr($atts['width']);
    $height = esc_attr($atts['height']);
    
    return '<iframe src="' . $iframe_url . '" width="' . $width . 'px" height="' . $height . 'px" frameborder="0" scrolling="no" style="border: none; display: block; margin: 10px 0;"></iframe>';
}
add_shortcode('firekyt_widget', 'firekyt_widget_shortcode');

// Add admin notice
function firekyt_admin_notice() {
    echo '<div class="notice notice-success is-dismissible">
        <p><strong>FireKyt Widget Embed Plugin Activated!</strong> You can now embed FireKyt widgets using iframe tags or the shortcode: <code>[firekyt_widget id="YOUR_WIDGET_ID" domain="YOUR_FIREKYT_DOMAIN"]</code></p>
    </div>';
}

// Show notice only once after activation
function firekyt_activation_notice() {
    add_option('firekyt_widget_embed_notice', true);
}
register_activation_hook(__FILE__, 'firekyt_activation_notice');

if (get_option('firekyt_widget_embed_notice')) {
    add_action('admin_notices', 'firekyt_admin_notice');
    delete_option('firekyt_widget_embed_notice');
}
?>
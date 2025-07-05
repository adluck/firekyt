/**
 * FireKyt Widget Embedder - Gutenberg Block Support
 * Version: 1.0.0
 */

(function() {
    'use strict';
    
    // Ensure WordPress block editor is available
    if (typeof wp === 'undefined' || !wp.blocks || !wp.element || !wp.editor) {
        return;
    }
    
    const { registerBlockType } = wp.blocks;
    const { createElement: el, useState, useEffect } = wp.element;
    const { InspectorControls, useBlockProps } = wp.blockEditor || wp.editor;
    const { PanelBody, TextControl, SelectControl, ToggleControl } = wp.components;
    
    // Register FireKyt Widget Block
    registerBlockType('firekyt/widget-embed', {
        title: 'FireKyt Widget',
        description: 'Embed FireKyt affiliate widgets safely and easily.',
        icon: 'embed-generic',
        category: 'embed',
        keywords: ['firekyt', 'affiliate', 'widget', 'embed'],
        
        attributes: {
            widgetId: {
                type: 'string',
                default: ''
            },
            domain: {
                type: 'string',
                default: ''
            },
            width: {
                type: 'number',
                default: 300
            },
            height: {
                type: 'number',
                default: 250
            },
            loading: {
                type: 'string',
                default: 'lazy'
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { widgetId, domain, width, height, loading } = attributes;
            const blockProps = useBlockProps();
            
            // Generate preview URL
            const previewUrl = widgetId && domain ? 
                `${window.location.protocol}//${domain}/widgets/${widgetId}/iframe` : '';
            
            return el('div', blockProps, [
                // Inspector Controls (Sidebar)
                el(InspectorControls, { key: 'inspector' }, [
                    el(PanelBody, {
                        title: 'Widget Settings',
                        initialOpen: true,
                        key: 'settings'
                    }, [
                        el(TextControl, {
                            label: 'Widget ID',
                            value: widgetId,
                            onChange: (value) => setAttributes({ widgetId: value }),
                            help: 'Enter your FireKyt widget ID',
                            key: 'widget-id'
                        }),
                        el(TextControl, {
                            label: 'Domain',
                            value: domain,
                            onChange: (value) => setAttributes({ domain: value }),
                            help: 'Enter the domain hosting your widget (e.g., myapp.com)',
                            key: 'domain'
                        }),
                        el(TextControl, {
                            label: 'Width (px)',
                            type: 'number',
                            value: width,
                            onChange: (value) => setAttributes({ width: parseInt(value) || 300 }),
                            key: 'width'
                        }),
                        el(TextControl, {
                            label: 'Height (px)',
                            type: 'number',
                            value: height,
                            onChange: (value) => setAttributes({ height: parseInt(value) || 250 }),
                            key: 'height'
                        }),
                        el(SelectControl, {
                            label: 'Loading',
                            value: loading,
                            options: [
                                { label: 'Lazy', value: 'lazy' },
                                { label: 'Eager', value: 'eager' }
                            ],
                            onChange: (value) => setAttributes({ loading: value }),
                            key: 'loading'
                        })
                    ])
                ]),
                
                // Block Content
                el('div', {
                    className: 'firekyt-widget-block-editor',
                    style: {
                        border: '2px dashed #ccc',
                        borderRadius: '8px',
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    },
                    key: 'content'
                }, [
                    // Widget Preview or Placeholder
                    widgetId && domain ? [
                        el('iframe', {
                            src: previewUrl,
                            width: Math.min(width, 400), // Limit preview size
                            height: Math.min(height, 300),
                            frameBorder: '0',
                            style: {
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: '#fff'
                            },
                            title: 'FireKyt Widget Preview',
                            key: 'preview-iframe'
                        }),
                        el('p', {
                            style: {
                                marginTop: '10px',
                                fontSize: '12px',
                                color: '#666'
                            },
                            key: 'preview-text'
                        }, 'Widget Preview (may be scaled down)')
                    ] : [
                        el('div', {
                            style: {
                                fontSize: '24px',
                                marginBottom: '10px',
                                color: '#666'
                            },
                            key: 'icon'
                        }, '🎯'),
                        el('h3', {
                            style: {
                                margin: '0 0 10px 0',
                                color: '#333'
                            },
                            key: 'title'
                        }, 'FireKyt Widget'),
                        el('p', {
                            style: {
                                margin: '0',
                                color: '#666',
                                fontSize: '14px'
                            },
                            key: 'description'
                        }, 'Enter Widget ID and Domain in the sidebar to preview your widget.')
                    ]
                ])
            ]);
        },
        
        save: function(props) {
            const { attributes } = props;
            const { widgetId, domain, width, height, loading } = attributes;
            
            // Generate shortcode for the frontend
            if (!widgetId || !domain) {
                return null;
            }
            
            const shortcode = `[firekyt_widget id="${widgetId}" domain="${domain}" width="${width}" height="${height}" loading="${loading}"]`;
            
            return el('div', {
                className: 'firekyt-widget-shortcode',
                'data-shortcode': shortcode
            }, shortcode);
        }
    });
    
    // Register Generic Iframe Block
    registerBlockType('firekyt/iframe-embed', {
        title: 'Safe Iframe Embed',
        description: 'Safely embed external iframes with security controls.',
        icon: 'format-video',
        category: 'embed',
        keywords: ['iframe', 'embed', 'external', 'safe'],
        
        attributes: {
            src: {
                type: 'string',
                default: ''
            },
            width: {
                type: 'number',
                default: 300
            },
            height: {
                type: 'number',
                default: 250
            },
            title: {
                type: 'string',
                default: 'External Content'
            },
            loading: {
                type: 'string',
                default: 'lazy'
            }
        },
        
        edit: function(props) {
            const { attributes, setAttributes } = props;
            const { src, width, height, title, loading } = attributes;
            const blockProps = useBlockProps();
            
            return el('div', blockProps, [
                // Inspector Controls
                el(InspectorControls, { key: 'inspector' }, [
                    el(PanelBody, {
                        title: 'Iframe Settings',
                        initialOpen: true,
                        key: 'settings'
                    }, [
                        el(TextControl, {
                            label: 'Source URL',
                            value: src,
                            onChange: (value) => setAttributes({ src: value }),
                            help: 'Enter the full URL to embed',
                            key: 'src'
                        }),
                        el(TextControl, {
                            label: 'Width (px)',
                            type: 'number',
                            value: width,
                            onChange: (value) => setAttributes({ width: parseInt(value) || 300 }),
                            key: 'width'
                        }),
                        el(TextControl, {
                            label: 'Height (px)',
                            type: 'number',
                            value: height,
                            onChange: (value) => setAttributes({ height: parseInt(value) || 250 }),
                            key: 'height'
                        }),
                        el(TextControl, {
                            label: 'Title',
                            value: title,
                            onChange: (value) => setAttributes({ title: value }),
                            help: 'Accessible title for the iframe',
                            key: 'title'
                        }),
                        el(SelectControl, {
                            label: 'Loading',
                            value: loading,
                            options: [
                                { label: 'Lazy', value: 'lazy' },
                                { label: 'Eager', value: 'eager' }
                            ],
                            onChange: (value) => setAttributes({ loading: value }),
                            key: 'loading'
                        })
                    ])
                ]),
                
                // Block Content
                el('div', {
                    className: 'firekyt-iframe-block-editor',
                    style: {
                        border: '2px dashed #ccc',
                        borderRadius: '8px',
                        padding: '20px',
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    },
                    key: 'content'
                }, [
                    src ? [
                        el('iframe', {
                            src: src,
                            width: Math.min(width, 400),
                            height: Math.min(height, 300),
                            frameBorder: '0',
                            style: {
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: '#fff'
                            },
                            title: title,
                            key: 'preview-iframe'
                        }),
                        el('p', {
                            style: {
                                marginTop: '10px',
                                fontSize: '12px',
                                color: '#666'
                            },
                            key: 'preview-text'
                        }, 'Iframe Preview (may be scaled down)')
                    ] : [
                        el('div', {
                            style: {
                                fontSize: '24px',
                                marginBottom: '10px',
                                color: '#666'
                            },
                            key: 'icon'
                        }, '🖼️'),
                        el('h3', {
                            style: {
                                margin: '0 0 10px 0',
                                color: '#333'
                            },
                            key: 'title'
                        }, 'Safe Iframe Embed'),
                        el('p', {
                            style: {
                                margin: '0',
                                color: '#666',
                                fontSize: '14px'
                            },
                            key: 'description'
                        }, 'Enter a source URL in the sidebar to preview the embedded content.')
                    ]
                ])
            ]);
        },
        
        save: function(props) {
            const { attributes } = props;
            const { src, width, height, title, loading } = attributes;
            
            if (!src) {
                return null;
            }
            
            const shortcode = `[firekyt_iframe src="${src}" width="${width}" height="${height}" title="${title}" loading="${loading}"]`;
            
            return el('div', {
                className: 'firekyt-iframe-shortcode',
                'data-shortcode': shortcode
            }, shortcode);
        }
    });
    
})();
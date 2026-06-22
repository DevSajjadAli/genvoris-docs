---
sidebar_position: 8
title: WooCommerce shortcode
description: PHP shortcode that renders a Try-On button on any WooCommerce product page.
---

# WooCommerce shortcode

If you installed the [Genvoris WordPress plugin](../integrations/wordpress), this is done for you. The snippet below is for a custom theme without the plugin.

```php title="wp-content/themes/yourtheme/genvoris.php"
<?php
add_shortcode('genvoris_tryon', function ($atts) {
    if (!is_user_logged_in()) {
        return '<a href="' . esc_url(wp_login_url(get_permalink())) . '">Sign in to try on</a>';
    }
    global $product;
    if (!$product) return '';
    $image = wp_get_attachment_url($product->get_image_id());
    ob_start(); ?>
    <button
      type="button"
      class="genvoris-tryon-btn"
      data-image="<?php echo esc_attr($image); ?>"
    >Try it on</button>
    <?php
    return ob_get_clean();
});

// REST route that mints the session using the server-side API key.
add_action('rest_api_init', function () {
    register_rest_route('genvoris/v1', '/session', [
        'methods'  => 'POST',
        'callback' => function () {
            if (!is_user_logged_in()) return new WP_Error('auth', 'unauthenticated', ['status' => 401]);
            $user = wp_get_current_user();
            $body = wp_remote_post('https://genvoris.org/api/v1/customers/u_' . $user->ID . '/sessions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . GENVORIS_API_KEY, // define() in wp-config.php
                    'Content-Type'  => 'application/json',
                ],
                'body' => wp_json_encode(['expires_in' => 900]),
            ]);
            if (is_wp_error($body)) return $body;
            return new WP_REST_Response(json_decode(wp_remote_retrieve_body($body), true));
        },
        'permission_callback' => '__return_true',
    ]);
});

// Front-end glue.
add_action('wp_footer', function () { ?>
  <script src="https://api.genvoris.org/widget.js?no_fab=1"
          data-api-url="<?php echo esc_url_raw(rest_url('genvoris/v1/proxy/')); ?>"
          data-events-url="<?php echo esc_url_raw(rest_url('genvoris/v1/proxy/api/v1/events')); ?>"
          data-platform="woocommerce"
          data-no-fab="true"
          defer></script>
  <script>
    document.querySelectorAll('.genvoris-tryon-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const r = await fetch('<?php echo esc_url_raw(rest_url('genvoris/v1/session')); ?>', {
          method: 'POST',
          headers: { 'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>' },
        });
        if (!r.ok) return;
        const { token } = await r.json();
        window.Genvoris.openTryOn({
          productImages: [btn.dataset.image],
          token,
        });
      });
    });
  </script>
<?php });
```

Then drop the shortcode into the product short description:

```text
[genvoris_tryon]
```

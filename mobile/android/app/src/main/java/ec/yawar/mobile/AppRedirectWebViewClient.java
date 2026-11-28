package ec.yawar.mobile;

import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Android never asks the local server to answer a redirected request, so the redirect from Keycloak back to the app
 * (sign-in and sign-out) would go to the network and fail. Such a redirect is loaded again as a new navigation.
 */
class AppRedirectWebViewClient extends BridgeWebViewClient {

    private final Uri app;

    AppRedirectWebViewClient(Bridge bridge) {
        super(bridge);
        app = Uri.parse(bridge.getLocalUrl());
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        boolean backToApp = app.getScheme().equals(url.getScheme()) && app.getAuthority().equals(url.getAuthority());
        if (backToApp && request.isForMainFrame() && request.isRedirect()) {
            view.post(() -> view.loadUrl(url.toString()));
            return true;
        }
        return super.shouldOverrideUrlLoading(view, request);
    }
}

package ec.yawar.mobile;

import android.net.Uri;
import android.webkit.WebHistoryItem;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Android never asks the local server to answer a redirected request, so the redirect from Keycloak back to the app
 * (sign-in and sign-out) would go to the network and fail. Such a redirect is loaded again as a new navigation, and
 * the sign-in pages are then dropped from the history: going back to them would reload the app and lose the session.
 */
class AppRedirectWebViewClient extends BridgeWebViewClient {

    private final Uri app;
    private boolean returning;

    AppRedirectWebViewClient(Bridge bridge) {
        super(bridge);
        app = Uri.parse(bridge.getLocalUrl());
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        if (isApp(url) && request.isForMainFrame() && request.isRedirect()) {
            returning = true;
            view.post(() -> view.loadUrl(url.toString()));
            return true;
        }
        return super.shouldOverrideUrlLoading(view, request);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        // The replaced redirect also reports a finished page while the sign-in page is still the current one.
        WebHistoryItem current = view.copyBackForwardList().getCurrentItem();
        if (returning && current != null && isApp(Uri.parse(current.getUrl()))) {
            returning = false;
            view.clearHistory();
        }
    }

    private boolean isApp(Uri url) {
        return app.getScheme().equals(url.getScheme()) && app.getAuthority().equals(url.getAuthority());
    }
}

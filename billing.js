/**
 * Sky Hop — Play Billing facade.
 *
 * Web / GitHub Pages: always simulated (caller shows checkout modal).
 * Native (Capacitor + @capgo/native-purchases): tries real purchaseProduct;
 * if plugin/bridge unavailable or products not created yet, returns
 * { ok: false, simulated: true } so the existing simulated checkout can run.
 *
 * Create these one-time (INAPP) products in Play Console when ready:
 *   skyhop_remove_ads
 *   skyhop_stardust_5 / _15 / _40 / _80 / _150 / _300
 */
(function (global) {
  "use strict";

  var PRODUCTS = {
    REMOVE_ADS: "skyhop_remove_ads",
    STARDUST_5: "skyhop_stardust_5",
    STARDUST_15: "skyhop_stardust_15",
    STARDUST_40: "skyhop_stardust_40",
    STARDUST_80: "skyhop_stardust_80",
    STARDUST_150: "skyhop_stardust_150",
    STARDUST_300: "skyhop_stardust_300",
  };

  function isNativePlatform() {
    try {
      return !!(
        global.Capacitor &&
        typeof global.Capacitor.isNativePlatform === "function" &&
        global.Capacitor.isNativePlatform()
      );
    } catch (e) {
      return false;
    }
  }

  function getNativePurchases() {
    try {
      if (!isNativePlatform()) return null;
      var plugins = global.Capacitor && global.Capacitor.Plugins;
      return (plugins && plugins.NativePurchases) || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {string} productId
   * @returns {Promise<{ok:boolean, simulated?:boolean, cancelled?:boolean, error?:string, transaction?:any}>}
   */
  async function purchase(productId) {
    var NP = getNativePurchases();
    if (!NP || typeof NP.purchaseProduct !== "function") {
      return { ok: false, simulated: true };
    }
    try {
      if (typeof NP.isBillingSupported === "function") {
        var support = await NP.isBillingSupported();
        if (support && support.isBillingSupported === false) {
          return { ok: false, simulated: true, error: "billing_unsupported" };
        }
      }
      var transaction = await NP.purchaseProduct({
        productIdentifier: productId,
        productType: "inapp",
        /** Consumable stardust packs; remove-ads is non-consumable but plugin may still accept. */
        isConsumable: productId !== PRODUCTS.REMOVE_ADS,
      });
      return { ok: true, transaction: transaction };
    } catch (err) {
      var msg = (err && (err.message || err.errorMessage || String(err))) || "purchase_failed";
      var cancelled =
        /cancel/i.test(msg) ||
        (err && (err.code === "USER_CANCELLED" || err.code === "1"));
      if (cancelled) return { ok: false, cancelled: true, error: msg };
      // Products not yet in Play Console → fall back to simulated path
      return { ok: false, simulated: true, error: msg };
    }
  }

  /**
   * Restore non-consumables (Remove Ads). Stardust packs are consumable — not restored.
   * @returns {Promise<{ok:boolean, restored:string[], simulated?:boolean, error?:string}>}
   */
  async function restore() {
    var NP = getNativePurchases();
    if (!NP || typeof NP.restorePurchases !== "function") {
      return { ok: false, simulated: true, restored: [] };
    }
    try {
      await NP.restorePurchases();
      var restored = [];
      if (typeof NP.getPurchases === "function") {
        var res = await NP.getPurchases({ productType: "inapp" });
        var list = (res && (res.purchases || res.transactions)) || [];
        for (var i = 0; i < list.length; i++) {
          var id =
            list[i].productIdentifier ||
            list[i].productId ||
            list[i].sku ||
            "";
          if (id) restored.push(id);
        }
      }
      return { ok: true, restored: restored };
    } catch (err) {
      return {
        ok: false,
        restored: [],
        error: (err && err.message) || String(err),
      };
    }
  }

  function canUseNativeBilling() {
    return !!getNativePurchases();
  }

  global.SkyHopBilling = {
    PRODUCTS: PRODUCTS,
    purchase: purchase,
    restore: restore,
    canUseNativeBilling: canUseNativeBilling,
    isNativePlatform: isNativePlatform,
  };
})(typeof window !== "undefined" ? window : globalThis);

(ns dirac.automation.runtime
  (:require [chromex.logging :refer-macros [log warn error info]]
            [dirac.runtime :as runtime]
            [dirac.runtime.prefs :as runtime-prefs]
            [dirac.automation.helpers :as helpers]))

(defn configure-runtime-from-url-params! [url]
  (let [params (helpers/get-matching-query-params url #"^set-")
        prefs (into {} (for [[param value] params]
                         (let [key (keyword (second (re-find #"^set-(.*)" param)))]
                           [key value])))]
    (when-not (empty? prefs)
      (warn "setting dirac runtime prefs via url params" (pr-str prefs))                                                      ; use pr-str because cljs-devtools is not yet installed
      (runtime-prefs/merge-prefs! prefs))))

(defn init-runtime! [& [config]]
  (configure-runtime-from-url-params! (helpers/get-document-url))
  (when-let [runtime-prefs (:runtime-prefs config)]                                                                           ; override runtime prefs
    (warn "dirac runtime prefs override:" (pr-str runtime-prefs))                                                             ; use pr-str because cljs-devtools is not yet installed
    (runtime-prefs/merge-prefs! runtime-prefs))
  (if-not (:do-not-install-runtime config)                                                                                    ; override devtools features/installation
    (let [features-to-enable (cond-> []
                               (not (:do-not-enable-repl config)) (conj :repl))]
      (runtime/install! features-to-enable))
    (warn "dirac runtime override: do not install")))
(ns dirac.implant
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require [cljs.core.async :refer [put! <! chan timeout alts! close!]]
            [cljs.tools.reader.reader-types :as tools-reader-types]
            [clojure.tools.namespace.parse :as ns-parse]
            [chromex.support :refer-macros [oget oset ocall oapply]]
            [chromex.logging :refer-macros [log warn error info]]
            [dirac.utils :refer-macros [runonce]]
            [dirac.dev]
            [dirac.implant.editor :as editor]
            [dirac.implant.intercom :as intercom]
            [dirac.implant.automation :as automation]
            [dirac.implant.version :refer [version]]
            [dirac.implant.eval :as eval]
            [dirac.implant.feedback :as feedback]
            [clojure.string :as string]))

(defonce ^:dynamic *console-initialized* false)
(defonce ^:dynamic *implant-initialized* false)

; -- public API -------------------------------------------------------------------------------------------------------------
; following functions will be exposed as helpers for devtools javascript code
; they should be called via dirac.something object, see the mapping in dirac-api-to-export below

(defn post-feedback! [& args]
  (apply feedback/post! args))

(defn init-console! []
  (when-not *console-initialized*
    (assert *implant-initialized*)
    (set! *console-initialized* true)
    (intercom/init!)
    (feedback/post! "console initialized")))

(defn init-repl! []
  (assert *implant-initialized*)
  (assert *console-initialized*)
  (intercom/init-repl!)
  (feedback/post! "repl initialized"))

(defn adopt-prompt! [text-area-element use-parinfer?]
  (feedback/post! (str "adopt-prompt-element" " use-parinfer? " use-parinfer?))
  (let [editor (editor/create-editor! text-area-element :prompt use-parinfer?)]
    (editor/start-editor-sync!)
    editor))

(defn send-eval-request! [request-id code scope-info]
  (feedback/post! (str "send-eval-request: " code))
  (intercom/send-eval-request! request-id code scope-info))

(defn get-version []
  version)

(defn get-runtime-tag [callback]
  (go
    (let [tag (<! (eval/get-runtime-tag))]
      (callback tag))))

(defn ns-to-relpath [ns ext]
  (str (string/replace (munge ns) \. \/) "." (name ext)))

(defn parse-ns-from-source [source]
  (let [reader (tools-reader-types/string-push-back-reader source)]
    (when-let [ns-decl (ns-parse/read-ns-decl reader)]
      #js {:name (str (ns-parse/name-from-ns-decl ns-decl))})))

; -- dirac object augumentation ---------------------------------------------------------------------------------------------

; !!! don't forget to update externs.js when touching this !!!
(def dirac-api-to-export
  {"feedback"          post-feedback!
   "initConsole"       init-console!
   "initRepl"          init-repl!
   "adoptPrompt"       adopt-prompt!
   "sendEvalRequest"   send-eval-request!
   "getVersion"        get-version
   "getRuntimeTag"     get-runtime-tag
   "parseNsFromSource" parse-ns-from-source
   "nsToRelpath"       ns-to-relpath})

(defn enhance-dirac-object! [dirac]
  (doseq [[name fn] dirac-api-to-export]
    (oset dirac [name] fn)))

; -- init code --------------------------------------------------------------------------------------------------------------

(defn init-implant! []
  (when-not *implant-initialized*
    (set! *implant-initialized* true)
    (assert (not *console-initialized*))
    (enhance-dirac-object! (oget js/window "dirac"))                                                                          ; see front_end/dirac/dirac.js
    (automation/install!)
    (feedback/install!)
    (eval/start-eval-request-queue-processing-loop!)
    (feedback/post! "implant initialized")
    (info (str "Dirac implant v" (get-version) " initialized"))))

; -- intialization ----------------------------------------------------------------------------------------------------------

(runonce (init-implant!))
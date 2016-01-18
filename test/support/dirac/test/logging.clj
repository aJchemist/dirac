(ns dirac.test.logging
  (require [clj-logging-config.log4j :as config]
           [dirac.lib.utils :as utils]))

(def base-options
  {:pattern (str (utils/wrap-with-ansi-color utils/ANSI_MAGENTA "# %m") "%n")})

; -- our default setup ------------------------------------------------------------------------------------------------------

(defn setup-logging! [& [config]]
  (let [options (utils/config->logging-options config)]
    (config/set-loggers!
      "com.ning.http.client.providers.netty.request.NettyConnectListener" (utils/make-logging-options base-options options)
      "dirac.agent-test" (utils/make-logging-options base-options options)
      "dirac.test.mock-tunnel-client" (utils/make-logging-options base-options options))))
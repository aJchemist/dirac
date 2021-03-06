(ns dirac.automation)

(defmacro go-job [& body]
  `(cljs.core.async.macros/go
     (cljs.core.async/<! (dirac.automation.task/task-started!))
     ~@body
     (if (dirac.automation.task/running?)
       (cljs.core.async/<! (dirac.automation.task/task-finished!)))))

(defmacro go-task [& args]
  (let [first-arg (first args)
        config (if (map? first-arg) first-arg)
        commands (if config (rest args) args)]
    `(do
       (cljs.test/deftest ~'browser-test
         (cljs.test/async ~'browser-test-done
           (dirac.automation/go-job
             ~@commands
             (~'browser-test-done))))
       (dirac.automation.launcher/register-task! (fn []
                                                   (cljs.test/run-tests
                                                     (cljs.test/empty-env :cljs.test/default))))
       (dirac.automation.task/task-setup!))))

(defmacro <!* [action & args]
  {:pre [(symbol? action)]}
  `(cljs.core.async/<! (dirac.automation/action! ~action (meta #'~action) ~@args)))
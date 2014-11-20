/**************************************************************************
* AngularJS-ng-error-logger, v0.0.9; MIT License;
* Author: Ankit Jain
**************************************************************************/
(function(){

    'use strict';

    angular.module('ng-error-logger', [])
      .factory(
        "stacktraceService",
        function() {
          // "printStackTrace" is a global object.
          return({
              print: printStackTrace
          });
        }
      )
      .provider(
        "$exceptionHandler",
        {
          $get: function( errorLogService ) {
            return( errorLogService );
          }
        }
      )
      .factory(
        "errorLogService",
        function( $log, $window, stacktraceService ) {
          function log( exception, cause ) {
            // Pass off the error to the default error handler
            // on the AngularJS logger. This will output the
            // error to the console (and let the application
            // keep running normally for the user).
            $log.error.apply( $log, arguments );
            // Now, we need to try and log the error the server.
            // --
            try {
              var errorMessage = exception.toString();
              var stackTrace = stacktraceService.print({ e: exception });
              // Log the JavaScript error to the server.
              // --
              // NOTE: In this demo, the POST URL doesn't
              // exists and will simply return a 404.
              $.ajax({
                type: "POST",
                url: "./logClientExceptions",
                contentType: "application/json",
                data: angular.toJson({
                  errorUrl: $window.location.href,
                  errorMessage: errorMessage,
                  stackTrace: stackTrace,
                  cause: ( cause || "" )
                })
              });
            } catch ( loggingError ) {
              // For Developers - log the log-failure.
              $log.warn( "Error logging failed" );
              $log.log( loggingError );
            }
          }
          // Return the logging function.
          return( log );
        }
      )
      // register the interceptor as a service
      .factory('angularHTTPInterceptor', function($q) {
        return {
          // optional method
          'request': function(config) {
            // do something on success
            return config;
          },

          // optional method
         'requestError': function(rejection) {
            // do something on error
            if (canRecover(rejection)) {
              return responseOrNewPromise
            }
            return $q.reject(rejection);
          },

          // optional method
          'response': function(response) {
            // do something on success
            return response;
          },

          // optional method
         'responseError': function(rejection) {
            // do something on error
            var httpErrorUrls = "./logHttpErrors";
            console.log(rejection);
            try{
              if(rejection.config.url != httpErrorUrls) {
                $.ajax({
                  type: "POST",
                  url: "./logHttpErrors",
                  contentType: "application/json",
                  data: angular.toJson(rejection)
                });
              }
            } catch(e) {
              console.log(e);
            }
            return $q.reject(rejection);
          }
        };
      })
      .config(function($httpProvider){
        $httpProvider.interceptors.push('angularHTTPInterceptor'); //Push the interceptor here
      });
})();
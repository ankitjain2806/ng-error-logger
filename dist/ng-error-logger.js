/**************************************************************************
* AngularJS-ng-error-logger, v0.0.10; MIT License;
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
        'errorLogger',function() {
          this.config = {};
          this.config.httpErrorLogUrl = './api/logHttpErrors';
          this.config.clientExceptionLogUrl = './api/logClientExceptions';
          this.config.httpErrorLogging = false;
          this.config.clientExceptionLogging = false;
          this.initializeConfig = function(httpErrorLogUrl, httpErrorLoggingStatus, clientExceptionLogUrl, clientExceptionLoggingStatus) {
            this.config.httpErrorLogUrl = httpErrorLogUrl;
            this.config.clientExceptionLogUrl = clientExceptionLogUrl;
            this.config.httpErrorLogging = httpErrorLoggingStatus;
            this.config.clientExceptionLogging = clientExceptionLoggingStatus;
          }
          this.initializeHttpLoggingConfig = function(httpErrorLogUrl, httpErrorLoggingStatus) {
            this.config.httpErrorLogUrl = httpErrorLogUrl;
            this.config.httpErrorLogging = httpErrorLoggingStatus;
          }
          this.initializeExceptionLoggingConfig = function(clientExceptionLogUrl, clientExceptionLoggingStatus) {
            this.config.clientExceptionLogUrl = clientExceptionLogUrl;
            this.config.clientExceptionLogging = clientExceptionLoggingStatus;
          }
          this.setHttpErrorLogUrl = function(url) {
            this.config.httpErrorLogUrl = url;
          }
          this.setClientExceptionLogUrl = function(url) {
            this.config.clientExceptionLogUrl = url;
          }
          this.getHttpErrorLogURL = function() {
            return this.config.httpErrorLogUrl;
          }
          this.getClientExceptionLogUrl = function() {
            return this.config.clientExceptionLogUrl;
          }
          this.setHttpErrorLogging = function(status) {
            this.config.httpErrorLogging = status;
          }
          this.setClientExceptionLogging = function(status) {
            this.config.clientExceptionLogging = status;
          }
          this.isHttpErrorLoggingOn = function(status) {
            return this.config.httpErrorLogging;
          }
          this.isClientExceptionLoggingOn = function(status) {
            return this.config.clientExceptionLogging;
          }

          this.$get = function() {
            return( this );
          }
        }
      )
      .provider(
        '$exceptionHandler',
        {
          $get: function( errorLogService ) {
            return( errorLogService );
          }
        }
      )
      .factory(
        'errorLogService',
        ['$log', '$window', 'stacktraceService', 'errorLogger', function( $log, $window, stacktraceService, errorLogger ) {
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
              if(errorLogger.isClientExceptionLoggingOn()) {
                $.ajax({
                  type: "POST",
                  url: errorLogger.getClientExceptionLogUrl(),
                  contentType: "application/json",
                  data: angular.toJson({
                    errorUrl: $window.location.href,
                    errorMessage: errorMessage,
                    stackTrace: stackTrace,
                    cause: ( cause || "" )
                  })
                });
              }
            } catch ( loggingError ) {
              // For Developers - log the log-failure.
              $log.warn( "Error logging failed" );
              $log.log( loggingError );
            }
          }
          // Return the logging function.
          return( log );
        }
      ])
      // register the interceptor as a service
      .factory('angularHTTPInterceptor', ['$q', 'errorLogger', '$cookieStore', function($q, errorLogger, $cookieStore) {
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
            console.log(rejection);
            try{
              if(errorLogger.isHttpErrorLoggingOn() && rejection.config.url != errorLogger.getHttpErrorLogURL()) {
                $.ajax({
                  type: 'POST',
                  beforeSend: function (request) {
                    if ($cookieStore.get('token')) {
                      request.setRequestHeader('Authorization', 'Bearer ' + $cookieStore.get('token'));
                    }
                  },
                  url: errorLogger.getHttpErrorLogURL(),
                  contentType: 'application/json',
                  data: angular.toJson(rejection)
                });
              }
            } catch(e) {
              console.log(e);
            }
            return $q.reject(rejection);
          }
        };
      }])
      .config('$httpProvider', function($httpProvider){
        $httpProvider.interceptors.push('angularHTTPInterceptor'); //Push the interceptor here
      });
})();
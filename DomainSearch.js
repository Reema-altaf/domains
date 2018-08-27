'use strict';
var DomainSearch = angular.module('DomainSearch', []);

DomainSearch.provider("DomainSearchUrl", [function () {
        var _url = null;

        this.setUrl = function (url) {
            _url = url;
        };

        this.$get = [function () {
                return _url;
            }];
    }]);
DomainSearch.factory("DomainSearch", ['$http', '$q', 'DomainSearchUrl',
    function ($http, $q, DomainSearchUrl) {
        var slugRegexp = /([a-z])+/ig;
        var excludedWords = ['the', 'and'];
        var joinSymbols = ['', '-'];
        var TLDs = ['.com', '.me', '.org', '.net', '.se', '.eu', '.nu', '.art', '.site', '.online','.tech' , '.store'];

        function isEmpty(str) {
            return (!str || 0 === str.length);
        }

        function checkAvailability(name) {
            if (isEmpty(name)) {
                return $q.reject(false);
            }
            return $http.get(DomainSearchUrl, {domain: name})
                    .then(function (response) {
                        return response.data.status;
                    }, function () {
                        return $q.resolve(false);
                    });
        }

        function getDomainNameOptions(basename) {
            basename = (basename || '').toLowerCase();

            var words = basename.match(slugRegexp);

            words = words.filter(function (word) {
                return !excludedWords.includes(word);
            });

            var namesToCheck = [];
            for (var i = 0; i < words.length; i++) {
                var testWords = words.slice(0, i + 1);
                for (var j = 0; j < joinSymbols.length; j++) {
                    var symbol = joinSymbols[j];
                    var name = testWords.join(symbol);
                    if (name.length >= 5 && name.length <= 20 && !namesToCheck.includes(name)) {
                        namesToCheck.push(name);
                    }
                }
            }

            return namesToCheck;
        }

        function getSuggestions(basename) {
            var results = [];
            var requests = [];
            var namesToCheck = getDomainNameOptions(basename);

            for (var i = 0; i < TLDs.length; i++) {
                var domain = TLDs[i];
                for (var j = 0; j < namesToCheck.length; j++) {
                    var name = namesToCheck[j];
                    var record = {domain: name + domain, free: false};
                    results.push(record);
                    var checker = checkAvailability(record.domain).then(function (result) {
                        record.free = result;
                    }, function () {
                        return $q.resolve();
                    });
                    requests.push(checker);
                }
            }

            return $q.all(requests).then(function () {
                return results;
            })
        }

        function getMostSuggestedDomain(domain_suggestions) {
            var most_suggested_domain = null;
            for (var i = 0; i < domain_suggestions.length; i++) {
                if (domain_suggestions[i].free) {
                    most_suggested_domain = domain_suggestions[i];
                    break;
                }
            }
            return most_suggested_domain;
        }

        return {
            checkAvailability: checkAvailability,
            getDomainNameOptions: getDomainNameOptions,
            getSuggestions: getSuggestions,
            getMostSuggestedDomain: getMostSuggestedDomain,
        };
    }]


        );


DomainSearch.directive('CheckDomain', ["DomainSearch", function (DomainSearch)
    {
        return {
            restrict: 'A',
            scope: {
                CheckDomain: '=',
                isChecking: "=?",
                result: "="
            },
            link: function (scope, element, attrs)
            {
                scope.result = null;

                if (!scope.CheckDomain) {
                    scope.CheckDomain = "";
                }

                if (scope.CheckDomain.length === 0) {
                    attrs.$set('disabled', 'true');
                }

                scope.$watch("CheckDomain", function (newValue) {
                    if (newValue.length > 0) {
                        attrs.$set('disabled', null);
                    } else {
                        attrs.$set('disabled', 'true');
                    }
                });

                element.bind('click', function () {
                    scope.isChecking = true;
                    scope.result = null;
                    DomainSearch.checkAvailability(scope.CheckDomain).then(function (result) {
                        scope.result = result;
                        scope.isChecking = false;
                    },
                            function () {
                                scope.result = false;
                                scope.isChecking = false;
                            });
                })
            }
        };
    }]);


DomainSearch.directive('GetDomainSuggestions', ["DomainSearch", function (DomainSearch)
    {
        return {
            restrict: 'A',
            scope: {
                GetDomainSuggestions: '=',
                isChecking: "=?",
                result: "="
            },
            link: function (scope, element, attrs)
            {
                scope.result = [];
                if (!scope.GetDomainSuggestions) {
                    scope.GetDomainSuggestions = "";
                }

                if (scope.GetDomainSuggestions.length === 0) {
                    attrs.$set('disabled', 'true');
                }

                scope.$watch("GetDomainSuggestions", function (newValue) {
                    if (newValue.length > 0) {
                        attrs.$set('disabled', null);
                    } else {
                        attrs.$set('disabled', 'true');
                    }
                });

                element.bind('click', function () {
                    scope.isChecking = true;
                    scope.result = [];
                    DomainSearch.getSuggestions(scope.GetDomainSuggestions).then(function (results) {
                        scope.isChecking = false;
                        scope.result = results;
                    });
                })
            }
        };
    }]);



if (![].includes) {
    Array.prototype.includes = function (searchElement/*, fromIndex*/) {
        'use strict';
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(arguments[1]) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) {
                k = 0;
            }
        }
        while (k < len) {
            var currentElement = O[k];
            if (searchElement === currentElement ||
                    (searchElement !== searchElement && currentElement !== currentElement)
                    ) {
                return true;
            }
            k++;
        }
        return false;
    };
}

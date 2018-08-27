var domainSearchApp = angular.module('domainSearchApp', ['DomainSearch']);

domainSearchApp.config(["DomainSearchUrlProvider", function (DomainSearchUrlProvider) {
        DomainSearchUrlProvider.setUrl("php/test.php");
    }]);

domainSearchApp.controller('DomainSearchController', function DomainSearchController($scope, DomainSearch) {
    $scope.getSuggestions = function () {
        $scope.availabilityChecked = false;
        $scope.suggestionsChecked = false;
        DomainSearch.getSuggestions($scope.domain).then(function (results) {
            $scope.suggestionsChecked = true;
            $scope.suggestions = results;
        });
    }
});

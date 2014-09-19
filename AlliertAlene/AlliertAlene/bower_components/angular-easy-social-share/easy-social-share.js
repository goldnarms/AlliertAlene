'use strict';

angular.module('td.easySocialShare', [])
  .directive('shareLinks', ['$location', function ($location) {
      return {
          scope: { feature: "&" },
          link: function (scope, elem, attrs) {
              var i,
                  sites = ['twitter', 'facebook', 'linkedin', 'google-plus'],
                  theLink,
                  links = attrs.shareLinks.toLowerCase().split(','),
                  pageLink = encodeURIComponent($location.absUrl().indexOf("aa00") > -1 || !scope.feature() ? $location.absUrl() : $location.absUrl() + scope.feature().id),
                  pageTitle = !!scope.feature() ? scope.feature().header : "Alliert og Alene",
                  pageTitleUri = encodeURIComponent(pageTitle),
                  shareLinks = [];
              elem.addClass('td-easy-social-share');
              // assign share link for each network
              angular.forEach(links, function (key) {
                  key = key.trim();
                  var icon = "";
                  switch (key) {
                      case 'twitter':
                          theLink = 'http://twitter.com/intent/tweet?text=' + pageTitleUri + '%20' + pageLink;
                          icon = "icon-twitter-bird";
                          break;
                      case 'facebook':
                          theLink = 'http://facebook.com/sharer.php?u=' + pageLink;
                          icon = "icon-facebook-rect";
                          break;
                      case 'linkedin':
                          theLink = 'http://www.linkedin.com/shareArticle?mini=true&url=' + pageLink + '&title=' + pageTitleUri;
                          break;
                      case 'google-plus':
                          theLink = 'https://plus.google.com/share?url=' + pageLink;
                          break;
                  }

                  if (sites.indexOf(key) > -1) {
                      shareLinks.push({ network: key, url: theLink, icon: icon });
                  }
              });

              for (i = 0; i < shareLinks.length; i++) {
                  var anchor = '';
                  anchor += '<a href="' + shareLinks[i].url + '"';
                  anchor += ' class="' + shareLinks[i].icon + '" target="_blank"';
                  anchor += '></a>';
                  elem.append(anchor);
              }
          }
      };
  }]);

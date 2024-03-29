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
              var html = '<ul class="list-inline">';
              for (i = 0; i < shareLinks.length; i++) {
                  var anchor = '<li>';
                  anchor += '<a href="' + shareLinks[i].url + '"';
                  anchor += 'target="_blank" title="Del p&aring ' + shareLinks[i].network[0].toUpperCase() + shareLinks[i].network.substring(1) + '"';
                  anchor += '><div class="share-' + shareLinks[i].network + '"></div></a></li>';
                  html = html + anchor;
              }
              html = html + "</ul>";
              elem.append(html);
          }
      };
  }]);

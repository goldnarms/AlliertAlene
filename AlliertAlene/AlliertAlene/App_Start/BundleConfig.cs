using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Optimization;

namespace AlliertAlene
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/thirdparties").Include(
//"~/bower_components/d3/d3.js",
                "~/Scripts/angular.js",
                "~/Scripts/angular-sanitize.js",
                "~/Scripts/bootstrap.js",
                "~/bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js",
                "~/bower_components/bootstrap-datepicker/js/locales/bootstrap-datepicker.no.js",
                //"~/Scripts/respond.js",
                "~/bower_components/mapbox.js/mapbox.js",
                "~/bower_components/video.js/video.js",
                "~/Scripts/jquery-{version}.js",
                "~/bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min.js",
                "~/bower_components/magnific-popup/dist/jquery.magnific-popup.min.js",
                "~/bower_components/underscore/underscore.js",
                "~/bower_components/lawnchair/src/Lawnchair.js",
                "~/bower_components/lawnchair/src/plugins/query.js",
                //"~/bower_components/lawnchair/src/adapters/blackberry-persistent-storage.js",
                //"~/bower_components/lawnchair/src/adapters/chrome-storage.js",

                "~/bower_components/lawnchair/src/adapters/dom.js",
                "~/bower_components/lawnchair/src/adapters/gears-sqlite.js",
                "~/bower_components/lawnchair/src/adapters/html5-filesystem.js",
                "~/bower_components/lawnchair/src/adapters/ie-userdata.js",
                "~/bower_components/lawnchair/src/adapters/indexed-db.js",
                "~/bower_components/lawnchair/src/adapters/memory.js",
                "~/bower_components/lawnchair/src/adapters/touchdb-couchdb.js",
                "~/bower_components/lawnchair/src/adapters/webkit-sqlite.js",
                "~/bower_components/lawnchair/src/adapters/window-name.js",
                "~/bower_components/slick.js/slick/slick.js"
                ));

            bundles.Add(new ScriptBundle("~/bundles/app")
                .IncludeDirectory("~/App/Controllers", "*.js")
                .IncludeDirectory("~/App/Directives", "*.js")
                .IncludeDirectory("~/App/Services", "*.js")
                .IncludeDirectory("~/App", "*.js")
                );

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                "~/Scripts/modernizr-*"));

            //bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
            //    "~/Scripts/modernizr-*"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                "~/Scripts/TimeLine/css/timeline.css",
                "~/bower_components/mapbox.js/mapbox.css",
                "~/bower_components/video.js/video-js.css",
                "~/Content/bootstrap.css",
                "~/Content/fontello.css",
                "~/bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css",
                "~/bower_components/magnific-popup/dist/magnific-popup.css",
                "~/bower_components/slick.js/slick/slick.css",
                "~/Content/Site.css"
                 ));

            // Set EnableOptimizations to false for debugging. For more information,
            // visit http://go.microsoft.com/fwlink/?LinkId=301862
            BundleTable.EnableOptimizations = true;
            //BundleTable.EnableOptimizations = false;
        }
    }
}

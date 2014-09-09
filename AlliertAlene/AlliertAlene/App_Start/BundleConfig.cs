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
                "~/bower_components/d3/d3.js",
                "~/bower_components/mapbox.js/mapbox.js",
                "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/app").IncludeDirectory(
                //"~/Scripts/sammy-{version}.js",
                //"~/Scripts/app/common.js",
                //"~/Scripts/app/app.datamodel.js",
                //"~/Scripts/app/app.viewmodel.js",
                //"~/Scripts/app/home.viewmodel.js",
                //"~/Scripts/app/_run.js")
                "~/App", "*.js"
                ));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/bootstrap.js",
                "~/Scripts/respond.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                "~/bower_components/mapbox.js/mapbox.css",
                "~/Content/bootstrap.css",
                "~/Content/Site.css"

                 ));

            // Set EnableOptimizations to false for debugging. For more information,
            // visit http://go.microsoft.com/fwlink/?LinkId=301862
            //BundleTable.EnableOptimizations = true;
            BundleTable.EnableOptimizations = false;
        }
    }
}

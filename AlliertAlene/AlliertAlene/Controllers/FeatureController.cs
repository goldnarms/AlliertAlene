using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Net;
using System.Web;
using System.Web.Mvc;
using AlliertAlene.Models;
using DataGenerator.DAL;
using DataGenerator.Models;

namespace AlliertAlene.Controllers
{
    public class FeatureController : Controller
    {
        private AlliedDbContext db = new AlliedDbContext();

        // GET: Feature
        public ActionResult Index()
        {
            return View(db.Datas
                .Include(d => d.Locations)
                .Include(d => d.Media)
                .Select(MapToViewModel));
        }

        // GET: Feature/Details/5
        public async Task<ActionResult> Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var baseData = await db.Datas.FindAsync(id);
            if (baseData == null)
            {
                return HttpNotFound();
            }
            return View(MapToViewModel(baseData));
        }

        // GET: Feature/Create
        public ActionResult Create()
        {
            var baseData = new BaseDataViewModel
            {
                CenterLocation = new DataLocation { VmCoordinate = new VmCoordinate() },
                Locations = new List<DataLocation>
            {
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()}
            }
            };
            var regions = db.Locations
                .Include(l => l.Coordinate)
                .Include(l => l.MarkerType)
                .Where(l => l.MarkerType == 3).Select(l => new SelectListItem {Text = l.Place, Value = l.Id.ToString()});
            baseData.Regions = regions.ToList();
            var mediaTypes = new List<SelectListItem>
            {
                new SelectListItem {Text = "Bilde", Value = "0"},
                new SelectListItem {Text = "Video", Value = "1"},
                new SelectListItem {Text = "Dagbok", Value = "2"}
            };
            baseData.MediaTypes = mediaTypes;
            return View(baseData);
        }

        // POST: Feature/Create
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateInput(false)]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Create(BaseDataViewModel model)
        {
            if (ModelState.IsValid)
            {
                var uploadDir = "~/Uploads";
                if (model.ImageUpload != null && model.ImageUpload.ContentLength > 0)
                {
                    var imagePath = Path.Combine(Server.MapPath(uploadDir), model.ImageUpload.FileName);
                    var imageUrl = "Uploads" + "/" + model.ImageUpload.FileName;
                    model.Text = model.Text.Replace("\"", "\\\"");
                    model.ImageUpload.SaveAs(imagePath);
                    model.Reference = imageUrl;
                }
                if (model.PosterUpload != null && model.PosterUpload.ContentLength > 0)
                {
                    var imagePath = Path.Combine(Server.MapPath(uploadDir), model.PosterUpload.FileName);
                    var imageUrl = "Uploads" + "/" + model.PosterUpload.FileName;
                    model.Text = model.Text.Replace("\"", "\\\"");
                    model.PosterUpload.SaveAs(imagePath);
                    model.PosterReference = imageUrl;
                }
                db.Datas.Add(MapToBaseData(model));
                await db.SaveChangesAsync();
                return RedirectToAction("Index");
            }

            return View(model);
        }

        // GET: Feature/Edit/5
        public async Task<ActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var baseData = await db.Datas.FindAsync(id);
            if (baseData == null)
            {
                return HttpNotFound();
            }
            return View(MapToViewModel(baseData));
        }

        // POST: Feature/Edit/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Edit([Bind(Include = "Id,Date,Region,Text,Media,Reference,Description")] BaseDataViewModel baseDataViewModel)
        {
            if (ModelState.IsValid)
            {
                db.Entry(MapToBaseData(baseDataViewModel)).State = EntityState.Modified;
                await db.SaveChangesAsync();
                return RedirectToAction("Index");
            }
            return View(baseDataViewModel);
        }

        // GET: Feature/Delete/5
        public async Task<ActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var baseData = await db.Datas.FindAsync(id);
            if (baseData == null)
            {
                return HttpNotFound();
            }
            return View(MapToViewModel(baseData));
        }

        // POST: Feature/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> DeleteConfirmed(int id)
        {
            var baseData = await db.Datas.FindAsync(id);
            db.Datas.Remove(baseData);
            await db.SaveChangesAsync();
            return RedirectToAction("Index");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private BaseData MapToBaseData(BaseDataViewModel viewModel)
        {
            var locations =
                viewModel.Locations.Where(l => l != null && !string.IsNullOrEmpty(l.Place)).Select(l => new BaseData.Location
            {
                Coordinate = new BaseData.Coordinate
                {
                    Lat = l.VmCoordinate.Lat,
                    Lng = l.VmCoordinate.Lng
                },
                Id = l.Id,
                Place = l.Place,
                MarkerType = viewModel.SelectedMediaId,

            }
                );
            return new BaseData
            {
                Id = viewModel.Id,
                Date = viewModel.Date,
                Media = new BaseData.MediaAsset
                {
                    Description = viewModel.Description,
                    MediaType = (DataGenerator.Models.MediaType)viewModel.SelectedMediaId,
                    Reference = viewModel.Reference,
                    Poster = viewModel.PosterReference
                },
                Locations = locations.ToList(),
                Region = db.Locations.First(l => l.Id == viewModel.SelectedRegionId).Place,
                Text = viewModel.Text,
                CenterLocation = db.Locations.First(l => l.Id == viewModel.SelectedRegionId)
            };
        }

        private BaseDataViewModel MapToViewModel(BaseData baseData)
        {
            return new BaseDataViewModel
            {
                Date = baseData.Date,
                Description = baseData.Media != null ? baseData.Media.Description : "",
                Reference = baseData.Media != null ? baseData.Media.Reference : "",
                Region = baseData.Region,
                Text = baseData.Text,
                Media = baseData.Media != null ? (int)baseData.Media.MediaType : 0,
                Id = baseData.Id
            };
        }
    }
}

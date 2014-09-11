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
                CenterLocation = new DataLocation { VmCoordinate = new VmCoordinate()},
                Locations = new List<DataLocation>
            {
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()},
                new DataLocation { VmCoordinate = new VmCoordinate()}
            }
            };
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
                if (model.ImageUpload != null && model.ImageUpload.ContentLength > 0)
                {
                    var uploadDir = "~/Uploads";
                    var imagePath = Path.Combine(Server.MapPath(uploadDir), model.ImageUpload.FileName);
                    var imageUrl = "Uploads" + "/" + model.ImageUpload.FileName;
                    model.Text = model.Text.Replace("\"", "\\\"");
                    model.ImageUpload.SaveAs(imagePath);
                    model.Reference = imageUrl;
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
                MarkerType = l.MarkerType,
                
            }
                );
            return new BaseData
            {
                Id = viewModel.Id,
                Date = viewModel.Date,
                Media = new BaseData.MediaAsset
                {
                    Description = viewModel.Description,
                    MediaType = (DataGenerator.Models.MediaType)viewModel.Media,
                    Reference = viewModel.Reference
                },
                Locations = locations.ToList(),
                Region = viewModel.Region,
                Text = viewModel.Text,
                CenterLocation = new BaseData.Location
                {
                    Coordinate = new BaseData.Coordinate
                    {
                      Lat  = viewModel.CenterLocation.VmCoordinate.Lat,
                      Lng = viewModel.CenterLocation.VmCoordinate.Lng
                    },
                    MarkerType = 0,
                    Place = viewModel.Region
                }
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

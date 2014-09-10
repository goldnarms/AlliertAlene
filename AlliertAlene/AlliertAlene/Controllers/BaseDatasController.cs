using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
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
    public class BaseDatasController : Controller
    {
        private AlliedDbContext db = new AlliedDbContext();

        // GET: BaseDatas
        public async Task<ActionResult> Index()
        {
            return View(await db.Datas.ToListAsync());
        }

        // GET: BaseDatas/Details/5
        public async Task<ActionResult> Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            BaseData baseData = await db.Datas.FindAsync(id);
            if (baseData == null)
            {
                return HttpNotFound();
            }
            return View(baseData);
        }

        // GET: BaseDatas/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: BaseDatas/Create
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Create([Bind(Include = "Id,Date,Region,Text")] BaseDataViewModel baseData)
        {
            if (ModelState.IsValid)
            {
                db.Datas.Add(new BaseData
                {
                    Date = baseData.Date,
                    Media = new BaseData.MediaAsset
                    {
                        Description = baseData.Description,
                        MediaType = (DataGenerator.Models.MediaType)baseData.MediaType,
                        Reference = baseData.Reference
                    },
                    Region = baseData.Region,
                    Text = baseData.Text,
                    Locations = null
                });
                await db.SaveChangesAsync();
                return RedirectToAction("Index");
            }

            return View(baseData);
        }

        // GET: BaseDatas/Edit/5
        public async Task<ActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            BaseData baseData = await db.Datas.FindAsync(id);
            if (baseData == null)
            {
                return HttpNotFound();
            }
            return View(baseData);
        }

        // POST: BaseDatas/Edit/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Edit([Bind(Include = "Id,Date,Region,Text")] BaseData baseData)
        {
            if (ModelState.IsValid)
            {
                db.Entry(baseData).State = EntityState.Modified;
                await db.SaveChangesAsync();
                return RedirectToAction("Index");
            }
            return View(baseData);
        }

        // GET: BaseDatas/Delete/5
        public async Task<ActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            BaseData baseData = await db.Datas.FindAsync(id);
            if (baseData == null)
            {
                return HttpNotFound();
            }
            return View(baseData);
        }

        // POST: BaseDatas/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> DeleteConfirmed(int id)
        {
            BaseData baseData = await db.Datas.FindAsync(id);
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
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PolygonMap.Domain.ApiModels;
using PolygonMap.Domain.Supervisor;

using Microsoft.EntityFrameworkCore;
using PolygonMap.Domain.Entities;
using PolygonMap.Domain.Repositories;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace PolygonMap.API.Controllers
{
    [Route("api/[controller]")]
    public class PolygonMapController : Controller
    {

        private readonly IPolygonMapSupervisor _polygonMapSupervisor;

        public PolygonMapController(IPolygonMapSupervisor polygonMapSupervisor)
        {
            _polygonMapSupervisor = polygonMapSupervisor;
        }
        
        [HttpGet("[action]")]
        [Produces(typeof(List<ShapeApiModel>))]
        public async Task<ActionResult<List<ShapeApiModel>>> GetAllShapeAsync()
        {
            try
            {
                return new ObjectResult(await _polygonMapSupervisor.GetAllShapeAsync());
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex);
            }
        }
        [HttpGet("[action]/{id}")]
        [Produces(typeof(ShapeApiModel))]
        public async Task<ActionResult<ShapeApiModel>> GetShapeByIdAsync(int id)
        {
            try
            {
                var Shape = await _polygonMapSupervisor.GetShapeByIdAsync(id);
                if (Shape == null)
                {
                    return NotFound();
                }

                return Ok(Shape);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex);
            }
        }

        [HttpGet("[action]")]
        [Produces(typeof(List<PolygonApiModel>))]
        public async Task<ActionResult<List<PolygonApiModel>>> GetPolygonsByListOfIdsAsync([FromQuery] List<int> ids)
        {
            try
            {
                return new ObjectResult(await _polygonMapSupervisor.GetPolygonsByListOfIdsAsync(ids));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex);
            }
        }
        [HttpGet("[action]/{id}/{RegonName}/{newCenterLng}/{newCenterlat}")]
        [Produces(typeof(PolygonApiModel))]
        public async Task<ActionResult<PolygonApiModel>> CalPointsWithNewCenterAsync(int id, string RegonName, float newCenterlat, float newCenterLng)
        {
            try
            {
                var Shape = await _polygonMapSupervisor.GetShapeByIdAsync(id);
                if (Shape == null)
                {
                    return NotFound();
                }
              
                Shape.Points = DisplacementPoint(Shape, newCenterlat - Shape.FixedLatitude,
                                                        newCenterLng - Shape.FixedLongitude);
                var newPolygonApiModel = new PolygonApiModel()
                {
                    ShapeID = Shape.ShapeID,
                    Name = RegonName,
                    RealLatitude = newCenterlat,
                    RealLongitude = newCenterLng,
                    Points = JsonConvert.SerializeObject(Shape.Points,Formatting.Indented)
                };
               var polygon= await _polygonMapSupervisor.AddPolygonAsync(newPolygonApiModel);
                
                return Ok(polygon);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex);
            }
        }               

        [HttpPut("[action]/{id}")]
        [Produces(typeof(PolygonApiModel))]
        public async Task<ActionResult<PolygonApiModel>> UpdatePolygonByIdAsync(int id, [FromBody] PolygonApiModel input)
        {
            try
            {
                if (input == null)
                    return BadRequest();
                if (await _polygonMapSupervisor.GetPolygonByIdAsync(id) == null)
                {
                    return NotFound();
                }
                if (await _polygonMapSupervisor.UpdatePolygonAsync(input))
                {
                    return Ok(input);
                }

                return StatusCode(500);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex);
            }
        }

        [HttpDelete("[action]/{id}")]
        [Produces(typeof(void))]
        public async Task<ActionResult> DeletePolygonByIdAsync(int id)
        {
            try
            {
                if (await _polygonMapSupervisor.GetPolygonByIdAsync(id) == null)
                {
                    return NotFound();
                }

                if (await _polygonMapSupervisor.DeletePolygonAsync(id))
                {
                    return Ok();
                }

                return StatusCode(500);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex);
            }
        }

        private IList<PointApiModel> DisplacementPoint(ShapeApiModel shape, float lat, float lng)
        {
            foreach (PointApiModel point in shape.Points)
            {
                point.Latitude += lat;
                point.Longitude += lng;
            }
            return shape.Points;
        }

    }
}

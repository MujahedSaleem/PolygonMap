import { DeletedialogComponent } from './deletedialog/deletedialog.component';
import { Shape } from './Shape.model';
import { Component, ViewChild, OnInit, ViewContainerRef, Inject, ElementRef, ViewChildren } from '@angular/core';
import { ApiService } from './Api.service';
import { Polygon } from './polygon.model';
import { MouseEvent, LatLngLiteral } from '@agm/core/map-types';
import { TdDialogService, IAlertConfig } from '@covalent/core/dialogs';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TdLoadingService } from '@covalent/core/loading';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import html2canvas from 'html2canvas';

declare const google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit {
  polygon: any;
  map;
  Shapes: Shape[];
  newlng = 35.25868;
  paths: Array<LatLngLiteral>;
  // = [
  //   { lat: 31.961758254769403, lng: 35.25919233353204 },

  //   { lat: 31.955204320513342, lng: 35.26743207962579 },

  //   { lat: 31.94704766031417, lng: 35.26794706375665 },

  //   { lat: 31.940201332988277, lng: 35.26005064041681 },

  //   { lat: 31.9467563376274, lng: 35.2512959101922 },

  //   { lat: 31.955349968577934, lng: 35.250609264684385 },
  // ];
  Name;
  hallMap;

  CurrentPolygon: Polygon;
  editmode = false;
  newlat = 31.95229;
  @ViewChildren('googlemapspicture') googlemapspicture: ElementRef
  ngOnInit(): void {
    this.matIcon.addSvgIcon('google', this.domSant.bypassSecurityTrustResourceUrl('../assets/google.svg'))
    this.matIcon.addSvgIcon('fb', this.domSant.bypassSecurityTrustResourceUrl('../assets/fb.svg'));
    this.api.getShapes().subscribe((shapes: Shape[]) => {
      this.Shapes = shapes;
    });
  }
  exportToImage() {
    // let staticMapUrl = "https://maps.googleapis.com/maps/apijs?key=AIzaSyC9PnuRk42kbCPMOvsfHpn40r5SoyN38zI/staticmap";

    // staticMapUrl += "?center=" + this.newlat + "," + this.newlng;
    // staticMapUrl += "&size=220x350";
    // staticMapUrl += "&zoom=" + this.zoom;
    // staticMapUrl += "&maptype=" + google.maps.MapTypeId.ROADMAP;
    // //Loop and add polygon.
    // for (var i = 0; i < this.paths.length; i++) {
    //   staticMapUrl += "&polygon=color:red|" + this.paths[i].lat + "," + this.paths[i].lng;
    // }
    // let imgMap = document.getElementById("imgMap");
    // imgMap.src = staticMapUrl;
    // imgMap.style.display = "block";
  }
  bater() {
    console.log(this.googlemapspicture.nativeElement)
    html2canvas(document.getElementById('mappp')).then(canvas => {

      this.saveAs(canvas.toDataURL("image/png"), `canvas.png`)
    });
  }


  saveAs(uri, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
      link.href = uri;
      link.download = filename;
      //Firefox requires the link to be in the body
      document.body.appendChild(link);

      //simulate click
      link.click();

      //remove the link when done
      document.body.removeChild(link);
    } else {
      window.open(uri);
    }
  }
  constructor(private domSant: DomSanitizer, private matIcon: MatIconRegistry, private api: ApiService, public dialog: MatDialog, private alert: TdDialogService, private _viewContainerRef: ViewContainerRef) {
  }
  showrecycleBinIcon = false;
  showRecycleBin() {
    console.log('asd'
    )
    this.showrecycleBinIcon = true;
  }

  onMapReady(map) {
    this.map = map;
    // this.initDrawingManager(map);
  }
  getPaths(poly) {
    console.log("get path");
    const vertices = poly.getPaths().getArray()[0];
    let paths = [];
    vertices.getArray().forEach(function (xy, i) {
      // console.log(xy);
      let latLng = {
        lat: xy.lat(),
        lng: xy.lng()
      };
      paths.push(JSON.stringify(latLng));
    });
    console.log(paths)
    return paths;

  }
  newPolygonMode = false;


  handleEvent(event) {

    this.newlat = event.latLng.lat();
    this.newlng = event.latLng.lng();
  }
  Cancel() {
    this.editmode = false;
    this.newPolygonMode = false;
    this.hallMap.setMap(null);
  }
  showPolyGon = false;
  ShapeID;
  add() {
    this.paths = [];
  }
  Save() {
    this.paths = [];
    this.newPolygonMode = false;
    if (!this.editmode) {
      this.api.getPolygonTodraw(this.Name, this.ShapeID, this.newlat, this.newlng).subscribe((polgon: Polygon) => {
        this.CurrentPolygon = polgon;
        console.log(this.CurrentPolygon)
        let poi = JSON.parse(polgon.points);
        poi.map(x => {
          console.log(x)
          this.paths.push({ lat: x.Latitude, lng: x.Longitude });
          // this.hallMap.setMap(null);
          // this.initDrawingManager(this.map);
        });
        this.showPolyGon = true;
        this.newlat = this.paths[0].lat
        this.newlng = this.paths[0].lng;
        this.zoom = 14;

      });
    } else {
      this.api.UpdatePolygon(this.ShapeID, this.CurrentPolygon).subscribe((polgon: Polygon) => {
        this.CurrentPolygon = polgon;
        this.paths = [];
        let poi = JSON.parse(polgon.points);
        poi.map(x => {
          console.log(x)
          this.paths.push({ lat: x.Latitude, lng: x.Longitude });
          // this.hallMap.setMap(null);
          // this.initDrawingManager(this.map);
        });
        this.showPolyGon = true;
      });
    }

  }
  deleteDialog() {

    this.dialog.open(DeletedialogComponent, { data: this.CurrentPolygon.polygonID, disableClose: true }).afterClosed().subscribe(c => {
      if (c) {
        this.showPolyGon = false;
      }
    })
  }
  zoom = 10;
  startEdit() {
    this.editmode = true;
    this.Name = this.CurrentPolygon.name;
    this.newlng = this.CurrentPolygon.realLongitude;
    this.newlat = this.CurrentPolygon.realLatitude;
    this.ShapeID = this.CurrentPolygon;
  }
  // initDrawingManager(map: any) {


  //   this.hallMap = new google.maps.Polygon({
  //     paths: this.paths,
  //     strokeColor: '#FF0000',
  //     strokeOpacity: 0.8,
  //     strokeWeight: 2,
  //     fillColor: '#FF0000',
  //     fillOpacity: 0.3,
  //     editable: true,
  //     zoom: 30,
  //   });
  //   this.hallMap.addListener('click', x => {
  //     this.editmode = true;
  //     this.Name = this.CurrentPolygon.name;
  //   });
  //   this.hallMap.setMap(map);

  // }

  clickedMarker(label: string, index: number) {
    console.log(`clicked the marker: ${label || index}`)
  }



  markerDragEnd(m: marker, $event: MouseEvent) {
    this.newlat = $event.coords.lat;
    this.newlng = $event.coords.lng;
  }

  marker: marker =
    {
      lat: 31.9522,
      lng: 35.2332,
      label: 'A',
      draggable: true
    }


}

// just an interface for type safety.
interface marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
}

import { Component, OnInit } from '@angular/core';
import { CloudAppRestService, AlertService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { Papa, ParseResult } from 'ngx-papaparse';
import { DialogService } from 'eca-components';
import { from, of } from 'rxjs';
import { catchError, finalize, map, mergeMap, tap } from 'rxjs/operators';
import {inputRow, inputRowPurchaseRequest} from './request.model';



@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  files: File[] = [];
  results = '';
  processed = 0;
  requestsToProcess = 0;
  deletedRequests = 0;
  unDeletedRequests = 0;
  processedPurchaseRequests = 0;
  purchaseRequestsToProcess = 0;
  deletedPurchaseRequests = 0;
  unDeletedPurchaseRequests = 0;

  running: boolean;



  constructor(
      private restService: CloudAppRestService,
      private alert: AlertService,
      private papa: Papa,
      private dialogs: DialogService,
  ) { }

  ngOnInit() {
  }

  load() {
    this.papa.parse(this.files[0], {
      header: true,
      complete: this.parsed,
      skipEmptyLines: 'greedy'
    });
  }

  private parsed = async (result: ParseResult) => {
    if (result.errors.length > 0)
      console.warn('Errors:', result.errors);

    let requests: any[] = result.data.map((row: any) => row);
    this.dialogs.confirm('Are you sure you want to delete ' + requests.length + ' requests from alma?')
        .subscribe(result => {
          if (!result){
            return;
          }
          this.requestsToProcess = requests.length;
          this.deletedRequests = 0;
          this.unDeletedRequests = 0;
          this.processed = 0;
          this.running = true;
          from(requests).pipe(
              mergeMap(request => {
                return this.deleteRequest(request).pipe(tap(() => this.processed++));
              }),
              finalize(() => {
                this.running = false;
                if (this.deletedRequests > 0){
                  this.alert.success("Successfully deleted " + this.deletedRequests + " requests", {autoClose: false});
                }
                if (this.unDeletedRequests > 0){
                  this.alert.error("Error deleting " + this.unDeletedRequests + " requests");
                }
              })

          ).subscribe();
        })
  }

  deleteRequest(request: inputRow){
    if (!request['Holding Id'] && !request['Physical Item Id'] && request['MMS Id'] && request['Request Id']){
      return this.cancelTitleRequest(request);
    }
    else if (request['MMS Id'] && request['Holding Id'] && request['Physical Item Id'] && request['Request Id']){
      return this.cancelRequest(request);
    }
    else {
      this.results += "Skipped: " + JSON.stringify(request) + "\n";
      return of(null);
    }
  }

  deletePurchaseRequest(request: inputRowPurchaseRequest){
    console.log(request, request['Purchase Request ID'])
    if (request['Purchase Request ID']){
      return this.cancelPurchaseRequest(request);
    }
    else {
      this.results += "Skipped: " + JSON.stringify(request) + "\n";
      return of(null);
    }
  }

  cancelPurchaseRequest(request: inputRowPurchaseRequest){
    let purchase_request_to_delete = {
      url: `/almaws/v1/acq/purchase-requests/${request['Purchase Request ID']}`,
      method: HttpMethod.DELETE,
    };
    return this.restService.call(purchase_request_to_delete).pipe(
        map(() => {
          this.deletedPurchaseRequests++;
          this.results += `Successfully deleted purchase request id: ${request['Purchase Request ID']}\n`
        }),
        catchError(err => {
          this.unDeletedRequests++;
          console.log(err);
          this.results += `Error deleting purchase request id: ${request['Purchase Request ID']}, ${err.message}\n`
          return of(null);
        })
    );
  }
  cancelRequest(request: inputRow){
    let request_to_delete = {
      url: `/almaws/v1/bibs/${request['MMS Id']}/holdings/${request['Holding Id']}/items/${request['Physical Item Id']}/requests/${request['Request Id']}`,
      method: HttpMethod.DELETE,
    };
    return this.restService.call(request_to_delete).pipe(
        map(() => {
          this.deletedRequests++;
          this.results += `Successfully deleted request id: ${request['Request Id']}\n`
        }),
        catchError(err => {
          this.unDeletedRequests++;
          console.log(err);
          this.results += `Error deleting request id: ${request['Request Id']}, ${err.message}\n`
          return of(null);
        })
    );
  }

  cancelTitleRequest(request: inputRow){
    let request_to_delete = {
      url: `/almaws/v1/bibs/${request['MMS Id']}/requests/${request['Request Id']}`,
      method: HttpMethod.DELETE,
    };
    return this.restService.call(request_to_delete).pipe(
        map(() => {
          this.deletedRequests++;
          this.results += `Successfully deleted request id: ${request['Request Id']}\n`
        }),
        catchError(err => {
          this.unDeletedRequests++;
          console.log(err);
          this.results += `Error deleting request id: ${request['Request Id']}, ${err.message}\n`
          return of(null);
        })
    );
  }

  onSelect(event: any) {
    this.files.push(...event.addedFiles);
  }

  reset() {
    this.files = [];
    this.results = '';
    this.alert.clear();
  }

  get percentComplete() {
    return Math.round((this.processed/this.requestsToProcess)*100)
  }

  onRemove(event: any) {
    this.files.splice(this.files.indexOf(event), 1);
  }

  loadPurchaseRequests() {
    this.papa.parse(this.files[0], {
      header: true,
      complete: this.purchaseRequestsParsed,
      skipEmptyLines: 'greedy'
    });
  }

  private purchaseRequestsParsed = async (result: ParseResult) => {
    if (result.errors.length > 0)
      console.warn('Errors:', result.errors);

    let purchaseRequests: any[] = result.data.map((row: any) => row);
    this.dialogs.confirm('Are you sure you want to delete ' + purchaseRequests.length + ' purchase requests from alma?')
        .subscribe(result => {
          if (!result){
            return;
          }
          this.purchaseRequestsToProcess = purchaseRequests.length;
          this.deletedPurchaseRequests = 0;
          this.unDeletedPurchaseRequests = 0;
          this.processedPurchaseRequests = 0;
          this.running = true;
          from(purchaseRequests).pipe(
              mergeMap(request => {
                return this.deletePurchaseRequest(request).pipe(tap(() => this.processed++));
              }),
              finalize(() => {
                this.running = false;
                if (this.deletedPurchaseRequests > 0){
                  this.alert.success("Successfully deleted " + this.deletedPurchaseRequests + " purchase requests", {autoClose: false});
                }
                if (this.unDeletedPurchaseRequests > 0){
                  this.alert.error("Error deleting " + this.unDeletedRequests + " purchase requests");
                }
              })

          ).subscribe();
        })
  }

}
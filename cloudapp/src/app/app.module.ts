import { NgModule } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule, CloudAppTranslateModule, AlertModule } from '@exlibris/exl-cloudapp-angular-lib';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { DialogModule } from '@exlibris/eca-components';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main/main.component';


@NgModule({ declarations: [
        AppComponent,
        MainComponent
    ],
    bootstrap: [AppComponent], imports: [MaterialModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        AlertModule,
        FormsModule,
        ReactiveFormsModule,
        CloudAppTranslateModule.forRoot(),
        NgxDropzoneModule,
        DialogModule], providers: [
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'standard' } },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule { }

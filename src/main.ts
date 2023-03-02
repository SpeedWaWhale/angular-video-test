import 'zone.js/dist/zone';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule],
  template: `
  <video #preview width="1080" height="720" autoplay muted></video>
    <button (click)="start()">TEST</button>
    <a #download href="#">Download</a>
    <video #recorded width="1080" height="720" controls></video>
    <canvas #output></canvas>
  `,
})
export class App {
  @ViewChild('preview', { static: false }) previewElem: ElementRef;
  @ViewChild('recorded', { static: false }) recordedElem: ElementRef;
  @ViewChild('download', { static: false }) downloadElem: ElementRef;
  @ViewChild('output', { static: false }) canvasElem: ElementRef;

  name = 'Angular';

  ngAfterViewInit() {
    console.log(this.previewElem);
  }

  async streamScreen() {
    return navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: {
        displaySurface: 'monitor',
        frameRate: 60,
      } as MediaTrackConstraints,
    });
  }

  record(stream) {
    console.log(stream.getVideoTracks());
    let recorder = new MediaRecorder(stream);
    let videoChunks = [];
    recorder.ondataavailable = (frame) => {
      console.log('frame', frame);
      videoChunks.push(frame.data);
    };
    let stop = new Promise((resolve, reject) => {
      recorder.onstop = (data) => {
        console.log('stop', data);
        resolve(videoChunks);
      };
      recorder.onerror = (data) => {
        console.log('error', data);
        reject(data);
      };
    });
    recorder.start();
    return stop;
  }

  start() {
    this.streamScreen()
      .then((stream) => {
        console.log(this.previewElem);
        this.previewElem.nativeElement.srcObject = stream;
        this.previewElem.nativeElement.captureStream =
          this.previewElem.nativeElement.captureStream ||
          this.previewElem.nativeElement.mozCaptureStream;
        return new Promise(
          (resolve) => (this.previewElem.nativeElement.onplaying = resolve)
        );
      })
      .then(() => {
        return this.record(this.previewElem.nativeElement.captureStream());
      })
      .then((videoChunks) => {
        let videoBlock = new Blob(videoChunks as BlobPart[], {
          type: 'video/webm',
        });
        this.recordedElem.nativeElement.src = URL.createObjectURL(videoBlock);
        this.downloadElem.nativeElement.href =
          this.recordedElem.nativeElement.src;
      })
      .then(() => {
        // Draw into canvas
        this.canvasElem.nativeElement.width = 1080;
        this.canvasElem.nativeElement.height = 720;
        console.log(
          (this.canvasElem.nativeElement.width,
          this.canvasElem.nativeElement.height)
        );
        let canvasCtx = this.canvasElem.nativeElement.getContext('2d');
        const draw = (now, metadata) => {
          console.log('!!draw!!', now, metadata);
          let canvasCtx = this.canvasElem.nativeElement.getContext('2d');
          canvasCtx.drawImage(
            this.recordedElem.nativeElement,
            0,
            0,
            this.canvasElem.nativeElement.width,
            this.canvasElem.nativeElement.height
          );
          this.recordedElem.nativeElement.requestVideoFrameCallback(draw);
        };
        this.recordedElem.nativeElement.requestVideoFrameCallback(draw);
      });
  }
}

bootstrapApplication(App);

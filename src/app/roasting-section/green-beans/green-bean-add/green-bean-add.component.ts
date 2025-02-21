import {ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {IonSlides, ModalController, NavParams, Platform} from '@ionic/angular';


import {UIImage} from '../../../../services/uiImage';
import {UIHelper} from '../../../../services/uiHelper';
import {UIAnalytics} from '../../../../services/uiAnalytics';
import {UIFileHelper} from '../../../../services/uiFileHelper';
import {UIToast} from '../../../../services/uiToast';
import {TranslateService} from '@ngx-translate/core';
import {IBeanInformation} from '../../../../interfaces/bean/iBeanInformation';
import moment from 'moment';
import {GreenBean} from '../../../../classes/green-bean/green-bean';

import {UIGreenBeanStorage} from '../../../../services/uiGreenBeanStorage';

declare var cordova;

@Component({
  selector: 'app-green-bean-add',
  templateUrl: './green-bean-add.component.html',
  styleUrls: ['./green-bean-add.component.scss'],
})
export class GreenBeanAddComponent implements OnInit {

  @ViewChild('photoSlides', {static: false}) public photoSlides: IonSlides;

  public data: GreenBean = new GreenBean();
  private readonly green_bean_template: GreenBean;

  public visibleIndex: any = {};

  constructor (private readonly modalController: ModalController,
               private readonly navParams: NavParams,
               private readonly uiGreenBeanStorage: UIGreenBeanStorage,
               private readonly uiImage: UIImage,
               public uiHelper: UIHelper,
               private readonly uiAnalytics: UIAnalytics,
               private readonly uiFileHelper: UIFileHelper,
               private readonly uiToast: UIToast,
               private readonly translate: TranslateService,
               private readonly platform: Platform,
               private readonly changeDetectorRef: ChangeDetectorRef) {
    this.green_bean_template = this.navParams.get('green_bean_template');
  }


  public async ionViewWillEnter() {
    this.uiAnalytics.trackEvent('GREEN_BEAN', 'ADD');
    if (this.green_bean_template) {
      await this.__loadBean(this.green_bean_template);
    }

    // Add one empty bean information, rest is being updated on start
    if (this.data.bean_information.length <=0) {
      const beanInformation: IBeanInformation = {} as IBeanInformation;
      this.data.bean_information.push(beanInformation);
    }
  }

  public addImage(): void {
    this.uiImage.showOptionChooser()
      .then((_option) => {
        if (_option === 'CHOOSE') {
          // CHOSE
          this.uiImage.choosePhoto()
            .then((_path) => {
              this.data.attachments.push(_path.toString());
            });
        } else {
          // TAKE
          this.uiImage.takePhoto()
            .then((_path) => {
              this.data.attachments.push(_path.toString());
            });
        }
      });
  }

  public addBean(): void {

    if (this.__formValid()) {
      this.__addBean();
    }
  }

  public __addBean(): void {

    this.uiGreenBeanStorage.add(this.data);
    this.dismiss();
  }

  public async deleteImage(_index: number): Promise<any> {

    const splicedPaths: Array<string> = this.data.attachments.splice(_index, 1);
    for (const path of splicedPaths) {
      try {
        await this.uiFileHelper.deleteFile(path);
        this.uiToast.showInfoToast('IMAGE_DELETED');
      } catch (ex) {
        this.uiToast.showInfoToast('IMAGE_NOT_DELETED');
      }

    }
    if (this.data.attachments.length > 0) {
      // Slide to one item before
      this.photoSlides.slideTo(_index - 1, 0);
    }

  }

  public dismiss(): void {
    this.modalController.dismiss({
      dismissed: true
    },undefined,'green-bean-add');
  }

  private async __loadBean(_bean: GreenBean) {
    this.data.name = _bean.name;
    this.data.note = _bean.note;
    this.data.aromatics = _bean.aromatics;
    this.data.weight = _bean.weight;
    this.data.finished = false;
    this.data.cost = _bean.cost;


    this.data.decaffeinated = _bean.decaffeinated;
    this.data.url = _bean.url;
    this.data.ean_article_number = _bean.ean_article_number;

    this.data.bean_information = _bean.bean_information;
    this.data.cupping_points = _bean.cupping_points;



    const copyAttachments = [];
    for (const attachment of _bean.attachments) {
      try {
        const newPath: string = await this.uiFileHelper.copyFile(attachment);
        copyAttachments.push(newPath);
      } catch (ex) {

      }

    }
    this.data.attachments = copyAttachments;
  }

  private __formValid(): boolean {
    let valid: boolean = true;
    const name: string = this.data.name;
    if (name === undefined || name.trim() === '') {
      valid = false;
    }

    return valid;
  }

  public ngOnInit() {}
  public chooseDate(_event) {
    if (this.platform.is('cordova')) {
      _event.cancelBubble = true;
      _event.preventDefault();
      _event.stopImmediatePropagation();
      _event.stopPropagation();


      const myDate = new Date(); // From model.

      cordova.plugins.DateTimePicker.show({
        mode: 'date',
        date: myDate,
        okText: this.translate.instant('CHOOSE'),
        todayText: this.translate.instant('TODAY'),
        cancelText: this.translate.instant('CANCEL'),
        success: (newDate) => {
          this.data.date = moment(newDate).toISOString();
          this.changeDetectorRef.detectChanges();
        }, error: () => {

        }
      });

    }
  }



}

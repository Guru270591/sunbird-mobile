import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { TabsPage,SharedPreferences, OAuthService, Interact, TelemetryService, InteractType, InteractSubtype, Environment, PageId, ImpressionType } from 'sunbird';
import { ViewController } from 'ionic-angular/navigation/view-controller';
import { TranslateService } from '@ngx-translate/core';
import { ProfileType, ProfileService } from 'sunbird'
import { generateImpressionEvent, Map } from '../../app/telemetryutil';

const selectedCardBorderColor = '#006DE5';
const borderColor = '#F7F7F7';
const KEY_SELECTED_USER_TYPE = "selected_user_type";
const KEY_SELECTED_LANGUAGE = "selected_language";

@Component({
  selector: 'page-user-type-selection',
  templateUrl: 'user-type-selection.html',
})

export class UserTypeSelectionPage {

  userTypes: Array<string>;
  teacherContents: Array<string>;
  studentContents: Array<string>;
  allContents: Array<Array<string>> = [];
  teacherCardBorderColor: string = '#F7F7F7';
  studentCardBorderColor: string = '#F7F7F7';
  userTypeSelected: boolean = false;
  selectedUserType: string;
  continueAs: string = "";
  language: string;

  /**
   * Contains paths to icons
   */
  userImageUri: string = "assets/imgs/ic_anonymous.png";

  constructor(public navCtrl: NavController,
    private translate: TranslateService,
    private preference: SharedPreferences,
    private profileService: ProfileService,
    private telemetryService: TelemetryService,
    private zone: NgZone
  ) {
    this.initData();
  }

  initData() {
    let that = this;
    this.translate.get(["ROLE.ROLE_TYPE", "ROLE.TEACHER_CONTENT", "ROLE.STUDENT_CONTENT"])
      .subscribe(val => {
        that.userTypes = val["ROLE.ROLE_TYPE"];
        that.teacherContents = val["ROLE.TEACHER_CONTENT"];
        that.studentContents = val["ROLE.STUDENT_CONTENT"];
        that.allContents.push(that.teacherContents);
        that.allContents.push(that.studentContents);
      });
  }

  ionViewDidLoad() {
  }

  ionViewDidEnter(){
    this.telemetryService.impression(
      generateImpressionEvent(ImpressionType.VIEW,
        PageId.USER_TYPE_SELECTION,
        Environment.HOME, "", "", "")
    );
  }

  selectTeacherCard() {
    this.zone.run(() => {
      this.userTypeSelected = true;
      this.teacherCardBorderColor = selectedCardBorderColor;
      this.studentCardBorderColor = borderColor;
      this.selectedUserType = "teacher";
      this.continueAs = this.translateMessage('CONTINUE_AS_TEACHER');
      this.preference.putString(KEY_SELECTED_USER_TYPE, this.selectedUserType);
    });
  }

  selectStudentCard() {
    this.zone.run(() => {
      this.userTypeSelected = true;
      this.teacherCardBorderColor = borderColor;
      this.studentCardBorderColor = selectedCardBorderColor;
      this.selectedUserType = "student";
      this.continueAs = this.translateMessage('CONTINUE_AS_STUDENT');
      this.preference.putString(KEY_SELECTED_USER_TYPE, this.selectedUserType)
    });
  }

  continue() {
    let profileRequest = {
      handle: "Guest1",
      avatar: "avatar",
      language: "en",
      age: -1,
      day: -1,
      month: -1,
      standard: -1,
      profileType: ProfileType.TEACHER
    };

    this.generateInteractEvent(this.selectedUserType);

    if (this.selectedUserType != "teacher") {
      profileRequest.profileType = ProfileType.STUDENT;
    }

    this.profileService.createProfile(profileRequest,
      (success: any) => {
        console.log("createProfile success : " + success);
        if (success) {
          let response = JSON.parse(success);

          console.log("UID of the created user - " + response.uid)
          this.setUser(response.uid)
        }
      },
      (errorResponse: any) => {
        console.log("createProfile success : " + errorResponse);
      })

  }

  setUser(uid: string) {
    this.profileService.setCurrentUser(uid,
      (success: any) => {
        console.log("Set User Success - " + success);
        this.navCtrl.push(TabsPage, {
          loginMode: 'guest'
        });
      }, (error: any) => {
        console.log("Set User Error -" + error);
      })
  }

  generateInteractEvent(userType) {
    let interact = new Interact();
    interact.type = InteractType.TOUCH;
    interact.subType = InteractSubtype.CONTINUE_CLICKED;
    interact.pageId = PageId.USER_TYPE_SELECTION;
    interact.id = PageId.USER_TYPE_SELECTION;
    let values =new Map();
    values["UserType"]=userType;
    interact.valueMap = values;
    interact.env = Environment.HOME;
    this.telemetryService.interact(interact);
  }

  /**
   * Used to Translate message to current Language
   * @param {string} messageConst - Message Constant to be translated
   * @returns {string} translatedMsg - Translated Message
   */
  translateMessage(messageConst: string): string {
    let translatedMsg = '';
    this.translate.get(messageConst).subscribe(
      (value: any) => {
        translatedMsg = value;
      }
    );
    return translatedMsg;
  }

}

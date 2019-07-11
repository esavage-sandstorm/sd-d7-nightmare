'use strict';

module.exports = Drupal;

require('mocha-generators').install();

var chai = require('chai');
chai.config.includeStack = false;
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;
const fs = require('fs');

function Drupal(config) {
  let Drupal = this;
  /**
  * Logs the Nightmare instance out of Drupal
  **/
  // Drupal.Logout = function(){
  //   describe('Log out of Drupal', function() {
  //     this.timeout('60s');
  //     it ('User is logged out', function*(){
  //       var bodyClass = yield Nightmare
  //       .goto(options.URL+'/user/logout')
  //       .wait('.footer')
  //       .evaluate(()=>{
  //         return document.body.className.toString();
  //       });

  //       expect(bodyClass).to.contain('not-logged-in');
  //     });
  //   });
  // }
  // /**
  // * Log in to to Drupal using the credentials in the .env folder.
  // **/
  Drupal.goToPage = function(nightmare, request){
    let url = config.url;
    if (request[0] == '/'){
      url +=request;
    } else {
      url += '/' + request;
    }
    return it('Go to '+url, function*(){
      this.timeout('10s');
      let response = yield nightmare
      .goto(url);
      expect(response.code).to.equal(200, 'Invalid response: '+response.code);
    });
  }
  Drupal.Login = function(){
    return function(nightmare){
      const loginPage = (config.login) ? config.login : '/user';
      describe('Log in to Drupal', function() {
        this.timeout('240s');
        Drupal.goToPage(nightmare, loginPage);

        it('Does not have CAPTCHA', function*(){
          const captcha = yield nightmare
            .evaluate(() => {
              return Array.from(document.querySelectorAll('#user-login .g-recaptcha')).length;
            })
          expect(captcha, 'CAPTCHA exists; please disable it').to.equal(0);
        });

        it('Log in as '+config.username, function*() {
          var loggedInUser = yield nightmare
            .insert('#edit-name', config.username)
            .insert('#edit-pass', config.password)
            .click('#edit-submit')
            .wait('body.logged-in')
            .wait('.admin-menu-account')
            .evaluate(() => {
              return document.querySelector('.admin-menu-account a strong').innerText.toLowerCase();
            });
          expect(loggedInUser).to.equal(config.username.toLowerCase());
        });
      });
    }
  }
  Drupal.Home = function(nightmare){
    describe('Go to the home page', function(){
      Drupal.goToPage(nightmare,'/');
    })
  }

  Drupal.statusReport = function(){
    return function(nightmare) {
      describe('Check the status page', function(){
        Drupal.goToPage(nightmare, '/admin/reports/status');

        let statusReport = null;
        it('Gathering report', function*(){
          statusReport = yield nightmare
            .evaluate(() => {
              const report = [];
              const rows = Array.from(document.querySelectorAll('.system-status-report tr'));
              rows.forEach(row => {
                let item = {};
                item.type = row.className.replace('merge-up','').replace('merge-down','').trim();
                if (row.querySelector('.status-title')) {
                  item.title = row.querySelector('.status-title').innerText.trim();
                }
                if (row.querySelector('.status-value')) {
                  item.value = row.querySelector('.status-value').innerText.trim();
                }
                report.push(item);
              });
              return report;
            });
          });
          function getReportItemByTitle(title){
            return statusReport.filter(item => {
              return item.title == title;
            })[0];
          }
          it('Access to update.php is PROTECTED', function*(){
            const status = getReportItemByTitle('Access to update.php').value;
            expect(status).to.equal('Protected');
          });
          it('Configuration file is PROTECTED', function*(){
            const status = getReportItemByTitle('Configuration file').value;
            expect(status).to.equal('Protected');
          });
      });
    }
  }





  // Drupal.getMessages = function(){
  //   return function(Nightmare) {
  //     Nightmare
  //     .evaluate(()=>{

  //     })
  //   }
  // }
  // // Check page for errors, log if found.
  // Drupal.hasNoErrors = function(){
  //   return it ("Has no errors on page", function*(){
  //     var hasError = yield Nightmare
  //     .evaluate(()=>{
  //       var messages = {
  //         error: [],
  //         status: [],
  //       }
  //       var messageElements = Array.from(document.querySelectorAll('.messages'));
  //       if (messageElements){
  //         messageElements.forEach( msg =>{
  //           var invisible = msg.querySelector('.element-invisible')
  //           var invisibleText = '';
  //           if (invisible){
  //             invisibleText = invisible.innerText;
  //           }
  //           var text = msg.innerText.replace(invisibleText, '').trim();
  //           var type = msg.className.replace('messages', '').trim();
  //           messages[type].push(text);
  //         });
  //       }
  //       return messages;
  //     })
  //     .then(messages =>{
  //       var BgGreen = "\x1b[42m";
  //       var BgRed = "\x1b[41m";
  //       var FgWhite = "\x1b[37m";
  //       var FgBlack = "\x1b[30m";
  //       var reset = "\x1b[0m";
  //       if (messages.status.length > 0){
  //         messages.status.forEach( status =>{
  //           console.log(BgGreen+FgBlack+"        (√) "+status+reset);
  //         });
  //       }
  //       if (messages.error.length > 0){
  //         messages.error.forEach( error =>{
  //           console.error(BgRed+FgWhite+"        (x) "+error+reset);
  //         });
  //         return true;
  //         return Nightmare
  //         .evaluate(()=>{
  //           return true;
  //         });
  //       }
  //       return Nightmare
  //       .evaluate(()=>{
  //         return false;
  //       });
  //     });
  //     expect(hasError).to.equal(false);
  //   });
  // }
}

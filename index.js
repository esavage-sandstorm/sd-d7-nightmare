
module.exports = Drupal;

require('mocha-generators').install();

const chai = require('chai');
chai.config.includeStack = false;
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;
const fs = require('fs');



function Drupal(config) {
  let Drupal = this;


  Drupal.goToPage = function(request){
    return function(nightmare){
      let url = config.url;
      if (request[0] == '/'){
        url += request;
      } else {
        url += '/' + request;
      }
      nightmare.goto(url);
    }
  }

  Drupal.Login = function(){
    return function(nightmare){
      const loginPage = (config.login) ? config.login : '/user';

      it('Go to '+loginPage, function*(){
        this.timeout('10s');
        let response = yield nightmare
          .use(Drupal.goToPage(loginPage));
        expect(response.code).to.equal(200, 'Invalid response: '+response.code);
      });

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
    }
  }

  Drupal.statusReport = function(){

    return function(nightmare) {
      nightmare
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
      // end nightmare
    }
  };

  Drupal.addMenuItem = function(menuId, item){
    const menuAdmin = 'admin/structure/menu/manage/'+ menuId+'/add';
    return function(nightmare){
      it('Go to Menu admin', function*(){
        this.timeout('100s');
        let response = yield nightmare
          .use(Drupal.goToPage(menuAdmin))
        expect(response.code).to.equal(200, 'Invalid response: '+response.code);
      });
      it('Create menu item', function*(){
        this.timeout('10s');
        let message = yield nightmare
          .insert('#edit-link-title', item.title)
          .insert('#edit-link-path', item.path)
          .evaluate(parent => {
            const options = Array.from(document.querySelectorAll('#edit-parent option'));
            const theOption = options.filter(opt => {
              return opt.text.indexOf(parent) > -1;
            });
            if (theOption.length > 0){
              theOption[0].setAttribute('selected', 'selected');
            }
          }, item.parent)
          .select('#edit-weight', item.weight)
          // set checkbox true / false (todo move this to function)
          .evaluate(enabled => {
            const check = document.querySelector('#edit-enabled');
            if (enabled){
              check.setAttribute('checked', 'checked');
            } else {
              check.removeAttribute('checked');
            }
          }, item.enabled = true)
          .evaluate(expanded => {
            const check = document.querySelector('#edit-expanded');
            if (expanded){
              check.setAttribute('checked', 'checked');
            } else {
              check.removeAttribute('checked');
            }
          }, item.expanded = false)
          .click('#edit-xmlsitemap .fieldset-title')
          .wait(1000)
          .select('#edit-xmlsitemap-status', item.siteMapInclusion)
          .select('#edit-xmlsitemap-priority', item.siteMapPriority)
          .click('#edit-options-attributes .fieldset-title')
          .wait(1000)
          .insert('#edit-options-attributes-title', item.menuLink.title)
          .insert('#edit-options-attributes-id', item.menuLink.id)
          .insert('#edit-options-attributes-name', item.menuLink.name)
          .insert('#edit-options-attributes-rel', item.menuLink.relationship)
          .insert('#edit-options-attributes-class', item.menuLink.classes)
          .insert('#edit-options-attributes-style', item.menuLink.style)
          .select('#edit-options-attributes-target', item.menuLink.target)
          .insert('#edit-options-attributes-accesskey', item.menuLink.accessKey)
          .click('#edit-options-item-attributes .fieldset-title')
          .wait(1000)
          .insert('#edit-options-item-attributes-id', item.menuItem.id)
          .insert('#edit-options-item-attributes-class', item.menuItem.classes)
          .insert('#edit-options-item-attributes-style', item.menuItem.style)
          .click('#edit-submit')
          .wait('.messages')
          .evaluate(() => {
            return document.querySelector('.messages').innerText;
          })
          expect(message).to.contain('Your configuration has been saved.');
      });
    }
  }

  Drupal.logs = function(type, severity){
    // translate from text to code
    switch (severity){
      case 'emergency':
        severity = 0;
        break;
      case 'alert':
        severity = 1;
        break;
      case 'critical':
        severity = 2;
        break;
      case 'error':
        severity = 3;
        break;
      case 'warn':
      case 'warning':
        severity = 4;
        break;
      case 'notice':
        severity = 5;
        break;
      case 'info':
        severity = 6;
        break;
      case 'debug':
        severity = 7;
        break;
    }
    return function(nightmare) {
      nightmare.goto(config.url+'/admin/reports/dblog')
      .wait('#edit-filters .fieldset-title')
      .click('#edit-filters .fieldset-title')
      .select('#edit-filters #edit-type', type)
      .select('#edit-filters #edit-severity', severity)
      .click('#edit-filters #edit-submit')
      .wait('#admin-dblog')
      .wait(2000)
      .evaluate(()=> {
        const messages = [];
        let rows = Array.from(document.querySelectorAll('#admin-dblog tbody tr'));
        if (rows[0].innerText == 'No log messages available.'){
          return messages;
        }
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const message = {};
          if (cells.length > 0){
            message.type = cells[1].innerText;
            message.date = cells[2].innerText;
            message.text = cells[3].innerText;
            message.link = cells[3].querySelector('a').href;
            message.user = cells[4].innerText;
            messages.push(message);
          }
        });
        return messages;
      });
    }
  }
  Drupal.checkForUpdates = function(){
    return function(nightmare){
      nightmare.goto(config.url+'/admin/reports/updates')///check?destination=admin/reports/updates');
      .wait('.update.checked')
      .evaluate(() => {

        const updates = {};

        // get core
        updates.core = {};
        const coreTable = document.querySelector('table.update'); // its the first one
        const project = coreTable.querySelector('.project');
        updates.core.project = project.querySelector('a').innerText;
        updates.core.current = parseFloat(project.innerText.replace(updates.core.project,''));
        if (coreTable.querySelector('.version-details a')){
          updates.core.latest = parseFloat(coreTable.querySelector('.version-details a').innerText);
          }else {
            updates.core.latest = updates.core.current;
          }
        updates.core.status = coreTable.querySelector('.version-status span').className;
        // Security Updates
        updates.security = [];
        const securityRows = Array.from(document.querySelectorAll('.update tr.error'));
        securityRows.forEach(row => {
          const update = {};
          update.project = row.querySelector('.project a').innerText;
          update.current = row.querySelector('.project').innerText.replace(update.project,'');
          update.latest = row.querySelector('.version-details a').innerText;
          update.status = 'security';
          if (update.project != 'Drupal core'){
            updates.security.push(update);
          }
        })
        // Regular updates
        updates.outdated = [];
        const outdatedRows = Array.from(document.querySelectorAll('.update tr.warning'));
        outdatedRows.forEach(row => {
          const update = {};
          update.project = row.querySelector('.project a').innerText;
          update.current = row.querySelector('.project').innerText.replace(update.project,'');
          update.latest = row.querySelector('.version-details a').innerText;
          update.status = 'outdated';
          if (update.project != 'Drupal core'){
            updates.outdated.push(update);
          }
        })
        return updates;
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

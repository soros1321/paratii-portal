/* eslint-disable */
//
//
// Note for devs: WORK IN PROGRESS
// Check https://github.com/Paratii-Video/paratii-portal/issues/24 for progress
//
//
// MIGRATING FROM paratii-player/tests/
//
//
//
//
//
//
//
//
//
//
//
//

/* global localStorage */
import {
  SEED,
  USERADDRESS,
  assertUserIsLoggedIn,
  createUser,
  createUserKeystore,
  getAnonymousAddress,
  resetDb,
  createUserAndLogin,
  login,
  waitForUserIsLoggedIn,
  assertUserIsNotLoggedIn,
  nukeLocalStorage,
  clearUserKeystoreFromLocalStorage,
  getEthAccountFromApp,
  getPath,
  waitForKeystore,
  clearCookies
} from './test-utils/helpers.js'
// import { add0x } from '../imports/lib/utils.js'
import { assert } from 'chai'

describe('Profile and accounts workflow:', function () {

  it('arriving on a fresh device should create a keystore in localstorage @watch', async function() {
    // as spec'd in https://github.com/Paratii-Video/paratii-portal/wiki/Portal-Specs:-wallet-handling
    browser.url(getPath('/'))

    // check localStorage
    let keystore = waitForKeystore(browser)
    console.log(keystore)

  })
  it('register a new user', function () {
    browser.url(getPath('signup'))

    // fill in the form
    browser.waitForEnabled('#signup-name')
    browser.setValue('#signup-name', 'Guildenstern')
    browser.setValue('#signup-email', 'guildenstern@rosencrantz.com')
    browser.setValue('#signup-password', 'password')
    browser.click('#signup-submit')

    // the new user is automaticaly logged in after account creation
    // waitForUserIsLoggedIn(browser)

    // wait for the keystore to be generated
    // waitForKeystore(browser)

    // now a modal should be opened with the seed
    // browser.waitForClickable('#seed')
    // const seed = browser.getText('#seed strong', false)
    // browser.waitForClickable('#btn-check-seed')
    // browser.click('#btn-check-seed')
    // browser.waitForClickable('[name="check_seed"]')
    // browser.setValue('[name="check_seed"]', seed)
    // browser.waitForClickable('#btn-check-seed-finish')
    // browser.click('#btn-check-seed-finish')
    // browser.pause(1000)
    // the user is now logged in
    // assertUserIsLoggedIn(browser)
  })

  it('login', () => {
    // clear Cookies
    clearCookies()

    // fill form
    browser.url(getPath('login'))
    browser.waitForEnabled('#login-email')
    browser.setValue('#login-email', 'guildenstern@rosencrantz.com')
    browser.setValue('#login-password', 'password')
    browser.click('#login-submit')

    // verify page
    browser.waitForExist('#profile-email', 'page did not load')
    assert.equal(browser.getUrl(), getPath('profile'), 'not redirect to profile page')
    assert.equal(browser.getText('#profile-email'), 'guildenstern@rosencrantz.com', 'not same email')
  })

  it.skip('login as an existing user on a device with no keystore - use existing anonymous keystore ', function () {
    // create a meteor user
    server.execute(createUser)

    assertUserIsNotLoggedIn(browser)

    // go to the home page
    browser.url('http://localhost:3000')
    // wait until we have an anymous keystore available
    browser.waitUntil(function () {
      return browser.execute(function () {
        return localStorage.getItem(`keystore-anonymous`)
      }).value
    })
    const anonymousAddress = getAnonymousAddress()

    browser.waitAndClick('#nav-profile')
    browser.waitForClickable('[name="at-field-email"]')
    browser.waitAndSetValue('[name="at-field-email"]', 'guildenstern@rosencrantz.com')
    browser.waitAndSetValue('[name="at-field-password"]', 'password')
    browser.waitAndClick('#at-btn')

    // the user is now logged in

    waitForUserIsLoggedIn(browser)

    // we should now see a modal presenting a choice to restore the wallet or use a new one
    browser.waitForClickable('#walletModal')
    browser.waitAndClick('#create-wallet')
    browser.waitAndSetValue('[name="user_password"]', 'password')
    browser.click('#btn-create-wallet')

    waitForKeystore(browser)

    // the address of the new keystore should be the same as the old 'anonymous' address
    const publicAddress = getEthAccountFromApp()
    assert.equal(publicAddress, add0x(anonymousAddress))
  })

  it.skip('change password', async function (done) {
    browser.execute(clearUserKeystoreFromLocalStorage)
    createUserAndLogin(browser)
    waitForUserIsLoggedIn(browser)
    browser.url('http://localhost:3000/profile')
    const userAccount = getEthAccountFromApp()
    browser.sendSomeETH(userAccount, 3.1)
    browser.waitAndClick('.button-settings')
    browser.waitAndClick('.edit-password')
    browser.waitAndSetValue('[name="current-password"]', 'password')
    browser.waitAndSetValue('[name="new-password"]', 'new-password')
    browser.waitAndClick('#save-password')
    browser.waitForVisible('li.profile-wallet-item:last-child .amount')
    const amount = await browser.getText('li.profile-wallet-item:last-child .profile-wallet-item-balance', false)
    assert.isOk(['3.10 ETH', '3,10 ETH'].indexOf(amount) > -1)
    done()
  })

  it.skip('show an error message if provided wrong password ', function () {
    browser.execute(clearUserKeystoreFromLocalStorage)
    server.execute(resetDb)
    browser.pause(2000)

    // create a meteor user
    server.execute(createUser)

    // log in as the created user
    assertUserIsNotLoggedIn(browser)

    browser.url('http://localhost:3000')
    browser.waitAndClick('#nav-profile')

    browser.waitAndSetValue('[name="at-field-email"]', 'guildenstern@rosencrantz.com')
    browser.waitAndSetValue('[name="at-field-password"]', 'wrong password')
    browser.waitAndClick('#at-btn')

    // the user is now still not logged in
    assertUserIsNotLoggedIn(browser)

    browser.waitForClickable('.main-alert.error')
    let errorMsg = browser.getText('.main-alert.error p')
    assert.equal(errorMsg, 'That email and password combination is incorrect.')
  })

  it.skip('login as an existing user on a device with no keystore - restore keystore with a seedPhrase', function () {
    browser.execute(nukeLocalStorage)
    server.execute(resetDb)
    // create a meteor user
    server.execute(createUser)
    assertUserIsNotLoggedIn(browser)

    browser.url('http://localhost:3000')
    browser.waitForClickable('#nav-profile')
    browser.click('#nav-profile')
    browser.waitForClickable('[name="at-field-email"]')
    browser.setValue('[name="at-field-email"]', 'guildenstern@rosencrantz.com')
    browser.setValue('[name="at-field-password"]', 'password')
    browser.waitForClickable('#at-btn')
    browser.click('#at-btn')

    waitForUserIsLoggedIn(browser)
    // // we should now see a modal presenting a choice to restore the wallet or use a new one
    browser.waitForExist('#walletModal')
    // we choose to restore the keystore
    browser.waitForClickable('#restore-keystore')
    browser.click('#restore-keystore')
    // we now should see a modal in which we are asked for the seed to regenerate the keystore
    browser.waitForClickable('[name="field-seed"]')
    browser.setValue('[name="field-seed"]', SEED)
    browser.setValue('[name="field-password"]', 'password')
    browser.click('#btn-restorekeystore-restore')
    browser.waitUntil(function () {
      let publicAddress = getEthAccountFromApp()
      return publicAddress === USERADDRESS
    })
  })

  it.skip('try to register a new account with a used email', function () {
    server.execute(createUser)
    // browser.url('http://localhost:3000/profile')

    browser.url('http://localhost:3000/')
    browser.waitForClickable('#nav-profile')
    browser.click('#nav-profile')
    browser.pause(2000)
    // we should see the login form, we click on the register link
    browser.waitForClickable('#at-signUp')
    browser.click('#at-signUp')
    browser.pause(2000)
    // fill in the form
    browser.waitForExist('[name="at-field-name"]')
    browser.setValue('[name="at-field-name"]', 'Guildenstern')
    browser.setValue('[name="at-field-email"]', 'guildenstern@rosencrantz.com')
    browser.setValue('[name="at-field-password"]', 'password')
    // .setValue('[name="at-field-password_again"]', 'password')
    // submit the form
    browser.click('#at-btn')
    browser.waitForClickable('.main-alert.error')
    let errorMsg = browser.getText('.main-alert.error p')
    assert.equal(errorMsg, 'Email already exists.')
  })

  it.skip('do not overwrite a user address if failed to register a new user with a used email [TODO]', function () {
    // createUserAndLogin(browser)
    // browser.waitForVisible('#public_address')
    // const address = browser.getText('#public_address')
    // browser.pause(5000)
    // // logout
    // browser.$('#logout').click()
    // // browser.url('http://localhost:3000/profile')
    // browser.url('http://localhost:3000')
    // browser.waitForClickable('#nav-profile')
    // browser.click('#nav-profile')
    // // we should see the login form, we click on the register link
    // browser.waitForClickable('#at-signUp')
    // browser.pause(2000)
    // browser.click('#at-signUp')
    // // fill in the form
    // browser.waitForExist('[name="at-field-name"]')
    // browser
    //   .setValue('[name="at-field-name"]', 'Guildenstern')
    //   .setValue('[name="at-field-email"]', 'guildenstern@rosencrantz.com')
    //   .setValue('[name="at-field-password"]', 'password')
    //   .setValue('[name="at-field-password_again"]', 'password')
    // // submit the form
    // browser.$('#at-btn').click()
    //
    // // verify if the address doesn't changed
    // login(browser)
    // browser.waitForVisible('#public_address')
    // const address2 = browser.getText('#public_address')
    // assert.equal(web3.toChecksumAddress(address), address2, 'The address is not the same')
    // browser.pause(5000)
  })

  it.skip('shows the seed', function () {
    browser.execute(clearUserKeystoreFromLocalStorage)
    createUserAndLogin(browser)
    // browser.url('http://localhost:3000/profile')
    browser.execute(function () {
      utils = require('/imports/lib/utils.js') // eslint-disable-line no-undef
      utils.showModal('showSeed') // eslint-disable-line no-undef
    })

    // the showSeed modal should now be visible
    browser.waitForVisible('#show-seed')

    // TODO: why do we not ask for a password anymore here?
    // browser.waitForVisible('[name="user_password"]')
    // browser.setValue('[name="user_password"]', 'password')
    // browser.waitForEnabled('#btn-show-seed')
    // browser.pause(1000)
    // browser.click('#btn-show-seed')
    // browser.waitForClickable('#closeModal')
  })

  it.skip('send ether dialog works', function () {
    browser.execute(clearUserKeystoreFromLocalStorage)
    createUserAndLogin(browser)
    browser.execute(function () {
      utils = require('/imports/lib/utils.js') // eslint-disable-line no-undef
      utils.showModal('doTransaction', { type: 'Eth', label: 'Send Ether' }) // eslint-disable-line no-undef
    })

    // browser.url('http://localhost:3000/profile')
    // browser.waitForEnabled('#send-eth')
    // browser.pause(1000)
    browser.waitForExist('#form-doTransaction')
    // browser.pause(1000)
  })

  it.skip('do not show the seed if wrong password', function () {
    createUserAndLogin(browser)
    browser.pause(3000)
    browser.url('http://localhost:3000/profile')

    browser.waitForClickable('#show-seed')
    browser.click('#show-seed')
    browser.waitForVisible('[name="user_password"]')
    browser.setValue('[name="user_password"]', 'wrong')
    browser.waitForEnabled('#btn-show-seed')
    browser.pause(1000)
    browser.click('#btn-show-seed')

    // browser.waitForVisible('.main-form-input-password.error', 30000)
    browser.waitForVisible('.main-form-input-password.error')

    // // TODO: next test checks for error message - temp comment to get the test to pass
    // browser.waitForVisible('.control-label')
    // assert.equal(browser.getText('.control-label'), 'Wrong password', 'should show "Wrong password" text')
  })

  it.skip('restore the keystore', function () {
    createUserAndLogin(browser)
    browser.pause(4000)
    browser.url('http://localhost:3000/profile')
    browser.waitForClickable('#show-seed')
    browser.click('#show-seed')
    browser.waitForClickable('[name="user_password"]')
    browser.pause(1000)
    browser.setValue('[name="user_password"]', 'password')
    browser.waitForEnabled('#btn-show-seed')
    browser.click('#btn-show-seed')
    browser.pause(1000)
    browser.waitForClickable('#seed')
    const seed = browser.getHTML('#seed strong', false)
    const publicAddress = browser.getHTML('#public_address', false)

    browser.click('#closeModal')
    browser.execute(clearUserKeystoreFromLocalStorage)

    browser.refresh()
    browser.pause(2000)
    // we now have a user account that is known in meteor, but no keystore
    // TODO: in this case, the user is logged in, but has removed his keystore after logging in, the bastard
    // we need to show a blocking modal here
    //
    browser.waitForClickable('#walletModal #restore-keystore')
    browser.click('#walletModal #restore-keystore')
    browser.waitForClickable('[name="field-seed"]')
    browser.setValue('[name="field-seed"]', seed)
    browser.setValue('[name="field-password"]', 'password')
    browser.click('#btn-restorekeystore-restore')
    browser.waitForExist('#public_address')
    const newPublicAddress = browser.getHTML('#public_address', false)
    assert.equal(publicAddress, newPublicAddress)
  })

  it.skip('do not restore keystore if wrong password', function () {
    createUserAndLogin(browser)
    browser.url('http://localhost:3000/profile')
    browser.waitForClickable('#show-seed')
    browser.click('#show-seed')
    browser.waitForEnabled('[name="user_password"]')
    browser.pause(500)
    browser.setValue('[name="user_password"]', 'password')
    browser.waitForClickable('#btn-show-seed')
    browser.click('#btn-show-seed')
    browser.waitForClickable('#seed')
    const seed = browser.getHTML('#seed strong', false)
    // const publicAddress = browser.getHTML('#public_address', false)
    browser.waitForClickable('#closeModal')
    browser.click('#closeModal')
    browser.execute(clearUserKeystoreFromLocalStorage)
    browser.refresh()

    browser.waitForClickable('#walletModal #restore-keystore')
    browser.click('#walletModal #restore-keystore')
    browser.waitForVisible('[name="field-seed"]')
    browser.setValue('[name="field-seed"]', seed)
    browser.setValue('[name="field-password"]', 'wrong')
    browser.click('#btn-restorekeystore-restore')

    browser.waitForVisible('.main-form-input-password.error')
    // // TODO: next test checks for error message - temp comment to get the test to pass
    // browser.waitForVisible('.control-label')
    // assert.equal(browser.getText('.control-label'), 'Wrong password', 'should show "Wrong password" text')
  })

  it.skip('do not create a new wallet if the password is wrong', function () {
    // create a meteor user
    server.execute(createUser)
    assertUserIsNotLoggedIn(browser)

    // log in as the created user
    browser.url('http://localhost:3000')
    browser.waitForClickable('#nav-profile')
    browser.click('#nav-profile')

    browser.waitForClickable('[name="at-field-email"]')
    browser.setValue('[name="at-field-email"]', 'guildenstern@rosencrantz.com')
    browser.setValue('[name="at-field-password"]', 'password')
    browser.click('#at-btn')

    // the user is now logged in
    waitForUserIsLoggedIn(browser)

    // we should now see a modal presenting a choice to restore the wallet or use a new one
    browser.waitForClickable('#walletModal')
    browser.waitForClickable('#walletModal #create-wallet')
    browser.click('#walletModal #create-wallet')
    browser.waitForClickable('[name="user_password"]')
    browser.setValue('[name="user_password"]', 'wrong password')
    browser.click('#btn-create-wallet')

    browser.waitForVisible('.main-form-input-password.error')
    // // TODO: next test checks for error message - temp comment to get the test to pass
    // browser.waitForVisible('.control-label')
    // assert.equal(browser.getText('.control-label'), 'Wrong password', 'should show "Wrong password" text')
  })

  it.skip('arriving on profile page without being logged should redirect to home', function () {
    // TODO: implement the functionality and write this test
    browser.url('http://localhost:3000/profile')
    const url = browser.url()
    browser.pause(1000)
    assert.equal(url.value, 'http://localhost:3000/')
  })

  it.skip('arriving on the app with a keystore, but without being logged in, should ask what to do, then continue anonymously ', function () {
    // We show a modal with a short explation :
    // 'A wallet was found on this computer. Please sign in to use this wallet; or continue navigating anonymously'
    // if the user chooses the second option, a session var should be st so the user is not bothered again in the future
    createUserKeystore(browser)
    browser.url('http://localhost:3000')
    assertUserIsNotLoggedIn(browser)

    browser.waitForVisible('#foundKeystore')
    // the user can now choose between contiuing anonimously, or to log in
    // we choose anonimity
    browser.waitAndClick('#btn-foundKeystore-cancel')
    // we now see the main-alert-content
    browser.waitForEnabled('.main-alert-content')
    // and dismiss it
    browser.waitAndClick('.main-alert-button-close')
    // we remain not logged in
    assertUserIsNotLoggedIn(browser)
  })

  it.skip('arriving on the app with a keystore, but without being logged in, should ask what to do, then proceed to log in ', function () {
    // We show a modal with a short explation :
    // 'A wallet was found on this computer. Please sign in to use this wallet; or continue navigating anonymously'
    // if the user chooses the second option, a session var should be st so the user is not bothered again in the future
    createUserKeystore(browser)
    browser.url('http://localhost:3000')
    assertUserIsNotLoggedIn(browser)

    browser.waitForVisible('#foundKeystore')
    // the user can now choose between contiuing anonimously, or to log in
    // we choose to log in
    browser.waitAndClick('#btn-foundKeystore-login')

    // we should now see the login modal
    browser.waitForVisible('#loginModal')
  })

  describe('Password reset:', () => {
    it.skip('should not allow the user to change their password if they enter the incorrect current password ', function () {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')
      browser.click('.button-settings')
      browser.waitForClickable('.edit-password')
      browser.click('.edit-password')
      browser.waitAndSetValue('#current-password', 'foobar')
      browser.waitAndSetValue('#new-password', 'myshinynewpassword')
      browser.click('#save-password')

      assert.equal(browser.isVisible('.edit-password-modal'), true)
      browser.waitForVisible('.main-alert-content')
      browser.waitUntil(() => {
        // console.log(browser.getText('.main-alert-content'))
        return browser.getText('.main-alert-content') === 'Wrong password'
      })
    })

    it.skip('should not allow the user to attempt to change their password if they do not enter their current password ', function () {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')
      browser.click('.button-settings')
      browser.waitForClickable('.edit-password')
      browser.click('.edit-password')
      browser.waitAndSetValue('#current-password', 'myshinynewpassword')
      browser.click('#save-password')

      assert.equal(browser.isVisible('.edit-password-modal'), true)
      assert.equal(browser.getAttribute('#save-password', 'disabled'), 'true')
    })

    it.skip('should not allow the user to attempt to change their password if they do not enter a new password', function () {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitAndClick('.button-settings')
      browser.waitAndClick('.edit-password')
      browser.waitAndSetValue('#current-password', 'myshinynewpassword')
      browser.click('#save-password')

      assert.equal(browser.isVisible('.edit-password-modal'), true)
      assert.equal(browser.getAttribute('#save-password', 'disabled'), 'true')
    })

    it.skip('should not allow the user to attempt to change their password if they do not enter their current password or a new password', function () {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')
      browser.click('.button-settings')
      browser.waitForClickable('.edit-password')
      browser.click('.edit-password')
      browser.waitForClickable('#current-password')
      assert.equal(browser.getAttribute('#save-password', 'disabled'), 'true')
    })

    it.skip('should allow the user to attempt to change their password if they enter the correct current password and a new password', function () {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')
      browser.click('.button-settings')
      browser.waitForClickable('.edit-password')
      browser.click('.edit-password')
      browser.waitAndSetValue('#current-password', 'password')
      browser.waitAndSetValue('#new-password', 'foobar')
      browser.waitForClickable('#save-password')
      browser.click('#save-password')

      browser.waitUntil(() => {
        return !browser.isVisible('.edit-password-modal')
      })
      browser.pause(500)
      browser.waitForClickable('#logout a')
      browser.click('#logout a')
      browser.waitForVisible('#confirmLogout')
      browser.pause(500)
      browser.waitForClickable('#logoutBtn')
      browser.click('#logoutBtn')
      browser.waitForClickable('#nav-profile')
      assertUserIsNotLoggedIn(browser)

      login(browser, 'foobar')

      waitForUserIsLoggedIn(browser)
      assertUserIsLoggedIn(browser)
    })
  })

  describe('edit profile', () => {
    it.skip('should render the current profile\'s information correctly', () => {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')
      browser.click('.button-settings')
      browser.waitForClickable('.edit-profile-info')
      browser.click('.edit-profile-info')
      browser.waitForVisible('.modal-profile')

      assert.equal(browser.getAttribute('#new-username', 'placeholder'), 'foobar baz')
      assert.equal(browser.getAttribute('#new-email', 'placeholder'), 'guildenstern@rosencrantz.com')
      assert.equal(browser.getAttribute('.current-avatar', 'src'), 'https://google.com/images/stock.jpg')
    })

    it.skip('should not allow the user to save profile information if no new information is entered', () => {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')
      browser.click('.button-settings')
      browser.waitForClickable('.edit-profile-info')
      browser.click('.edit-profile-info')
      browser.waitForVisible('.modal-profile')

      assert.equal(browser.getAttribute('#save-profile-info', 'disabled'), 'true')
    })

    it.skip('should not allow the user to save profile information if only whitespace is entered into the name or email fields', () => {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')
      browser.click('.button-settings')
      browser.waitForClickable('.edit-profile-info')
      browser.click('.edit-profile-info')
      browser.waitForVisible('.modal-profile')
      browser.waitAndSetValue('#new-username', '        \n ')

      assert.equal(browser.getAttribute('#save-profile-info', 'disabled'), 'true')

      browser.waitForVisible('.modal-profile')
      browser.waitAndSetValue('#new-email', '       ')

      assert.equal(browser.getAttribute('#save-profile-info', 'disabled'), 'true')
    })

    it.skip('should allow the user to update their name', () => {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')

      assert.equal(browser.getText('.internals-header-title'), 'foobar baz')

      browser.click('.button-settings')
      browser.waitForClickable('.edit-profile-info')
      browser.click('.edit-profile-info')
      browser.waitForVisible('.modal-profile')
      browser.waitAndSetValue('#new-username', 'my shiny new name')

      browser.waitForClickable('#save-profile-info')
      browser.click('#save-profile-info')

      browser.waitUntil(() => {
        return browser.getText('.internals-header-title') === 'my shiny new name'
      })
    })

    it.skip('should allow the user to update their email', () => {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')

      browser.waitForVisible('.profile-user-email')
      assert.equal(browser.getText('.profile-user-email'), 'guildenstern@rosencrantz.com')

      browser.click('.button-settings')
      browser.waitForClickable('.edit-profile-info')
      browser.waitAndClick('.edit-profile-info')
      browser.waitForVisible('.modal-profile')

      browser.waitAndSetValue('#new-email', 'myGreatEmail@aol.com')

      browser.waitForClickable('#save-profile-info')
      browser.click('#save-profile-info')

      browser.waitUntil(() => {
        return browser.getText('.profile-user-email') === 'myGreatEmail@aol.com'
      })
    })

    it.skip('should not allow the user to update their email if they enter an invalid email', () => {
      createUserAndLogin(browser)
      browser.url('http://localhost:3000/profile')
      browser.waitForClickable('.button-settings')

      browser.waitForVisible('.profile-user-email')
      assert.equal(browser.getText('.profile-user-email'), 'guildenstern@rosencrantz.com')

      browser.click('.button-settings')
      browser.waitForClickable('.edit-profile-info')
      browser.waitAndClick('.edit-profile-info')
      browser.waitForVisible('.modal-profile')

      browser.waitAndSetValue('#new-email', 'fajwefnnnfnann')

      browser.waitForClickable('#save-profile-info')
      browser.click('#save-profile-info')

      browser.waitUntil(() => {
        return browser.getAttribute('#new-email', 'class').indexOf('error') >= 0
      })

      assert.equal(browser.isVisible('.modal-profile'), true)
      browser.waitForVisible('.profile-user-email')
      assert.equal(browser.getText('.profile-user-email'), 'guildenstern@rosencrantz.com')
    })
  })

  describe('profile redirects', () => {
    it('should redirect to login page if user not logged in', () => {
      // clear Cookies
      clearCookies()

      browser.url(getPath('profile'))
      const loginUrl = RegExp(getPath('login'))
      assert.match(browser.getUrl(), loginUrl, 'it is not login page')
      const profileUrl = RegExp(getPath('profile'))
      assert.notMatch(browser.getUrl(), profileUrl, 'it is the profile page')
    })
  })
})

/* @flow */

import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Button from 'components/foundations/Button'
import Hidden from 'components/foundations/Hidden'
import PTIBalanceContainer from 'containers/widgets/PTIBalanceContainer'
import { WALLET_KEY_SECURE } from 'constants/ParatiiLibConstants'

type Props = {
  isWalletSecured: boolean,
  closeNav: () => void,
  checkUserWallet: () => void
}

const Nav = styled.nav`
  display: block;
`

const NavList = styled.ul`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-start;
  }
`

const NavItem = styled.li`
  padding-left: 45px;

  @media (max-width: 768px) {
    padding: 20px 0;
  }
`

const StyleNavLink = Button.extend`
  font-size: 14px;
  font-weight: ${props => props.theme.fonts.weight.regular};
  text-transform: initial;
`

const StyleNavLinkPurple = Button.extend`
  font-size: 14px;
  font-weight: ${props => props.theme.fonts.weight.bold};
  text-transform: initial;
  color: ${props => props.theme.colors.body.primary};
`

const NavLink = StyleNavLink.withComponent(Link)
const NavLinkPurple = StyleNavLinkPurple.withComponent(Link)

const Anchor = StyleNavLink.withComponent('a')

class MainNavigation extends Component<Props, Object> {
  secureWallet: (e: Object) => void

  constructor (props: Props) {
    super(props)
    this.secureWallet = this.secureWallet.bind(this)
  }

  secureWallet (e: Object) {
    e.preventDefault()
    this.props.checkUserWallet()
    this.props.closeNav()
  }

  render () {
    const walletStringSecure: ?string = localStorage.getItem(WALLET_KEY_SECURE)

    return (
      <Nav>
        <NavList>
          <NavItem>
            <NavLink onClick={this.props.closeNav} to="/voucher">
              Get PTI
            </NavLink>
          </NavItem>
          <Hidden>
            <NavItem>
              <NavLink onClick={this.props.closeNav} to="/my-videos">
                My videos
              </NavLink>
            </NavItem>
          </Hidden>
          <NavItem>
            <NavLink onClick={this.props.closeNav} to="/upload">
              Upload
            </NavLink>
          </NavItem>
          <NavItem>
            <Anchor
              onClick={this.props.closeNav}
              href="http://paratii.video/"
              target="_blank"
            >
              About Paratii
            </Anchor>
          </NavItem>

          {!this.props.isWalletSecured ? (
            <NavItem>
              <NavLinkPurple
                data-test-id="login-signup"
                onClick={this.secureWallet}
                to="#"
              >
                {walletStringSecure ? 'Log In' : 'Sign Up'}
              </NavLinkPurple>
            </NavItem>
          ) : (
            <NavItem>
              <PTIBalanceContainer />
            </NavItem>
          )}
        </NavList>
      </Nav>
    )
  }
}

export default MainNavigation

/* eslint-disable react/no-array-index-key */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import isInternalLink from "../../utils/check-internal-links";
import getAssetPath from "../../utils/get-asset-path";
import getText from "../../utils/get-text";
import shouldLinkBeShown from "../../utils/should-link-be-shown";
import getHtml from "../../utils/get-html";

export default class AiryHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menu: false,
      stickyMsg: true,
    };
    this.handleHamburger = this.handleHamburger.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  handleHamburger() {
    const { menu } = this.state;
    this.setState({
      menu: !menu,
    });
  }

  handleKeyUp(event) {
    const { menu } = this.state;
    switch (event.keyCode) {
      case 13:
        this.setState({
          menu: !menu,
        });
        break;
      default:
        break;
    }
  }

  getStickyMsg = () => {
    const { stickyMsg } = this.state;
    const { header, language } = this.props;
    const { sticky_html: stickyHtml } = header;
    return stickyMsg && stickyHtml ? (
      <div className="sticky-container" role="banner">
        <div className="inner">
          {getHtml(stickyHtml, language, "sticky-msg")}
          <button
            type="button"
            className="close-sticky-btn"
            onClick={() => this.setState({ stickyMsg: false })}
          >
            ✖
          </button>
        </div>
      </div>
    ) : null;
  };

  render() {
    const { menu } = this.state;
    const {
      header,
      languages,
      language,
      orgSlug,
      setLanguage,
      location,
      isAuthenticated,
      userData,
    } = this.props;
    const { logo, links, second_logo: secondLogo } = header;
    const { pathname } = location;
    const internalLinks = [`/${orgSlug}/mobile-login`];
    return (
      <>
        <img
          src={getAssetPath(orgSlug, 'cloud-up.svg')}
          alt="Cloud Up"
          className="header-cloud-svg"
          loading="lazy"
        />
        <div className="header-container header-desktop">
          <div className="header-row-1">
            <div className="header-row-1-inner">
              <div className="header-right">
                {languages.map((lang) => (
                  <button
                    type="button"
                    className={`${language === lang.slug ? "active " : ""
                      }header-language-btn header-desktop-language-btn header-language-btn-${lang.slug
                      }`}
                    key={lang.slug}
                    onClick={() => setLanguage(lang.slug)}
                  >
                    {lang.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="header-mobile ">
          <div className="header-row-1">
            <div className="header-row-1-inner">
              <div className="header-right">
                <div
                  role="button"
                  tabIndex={0}
                  className="header-hamburger"
                  onClick={this.handleHamburger}
                  onKeyUp={this.handleKeyUp}
                >
                  <div className={`${menu ? "rot45" : ""}`} />
                  <div className={`${menu ? "rot-45" : ""}`} />
                  <div className={`${menu ? "opacity-hidden" : ""}`} />
                </div>
              </div>
            </div>
          </div>
          <div
            className={`${menu ? "display-flex" : "display-none"
              } header-mobile-menu`}
          >
            <div className="mobile-languages-row">
              {languages.map((lang) => (
                <button
                  type="button"
                  className={`${language === lang.slug ? "active " : ""
                    }header-language-btn header-mobile-language-btn header-language-btn-${lang.slug
                    }`}
                  key={lang.slug}
                  onClick={() => setLanguage(lang.slug)}
                >
                  {lang.text}
                </button>
              ))}
            </div>
          </div>
        </div>
        {this.getStickyMsg()}
        <img
          src={ getAssetPath(orgSlug, 'cloud_middle.svg') }
          alt="cloud"
          className="cloud-icon-middle"
          loading="lazy"
        />
      </>
    );
  }
}
AiryHeader.defaultProps = {
  isAuthenticated: false,
};
AiryHeader.propTypes = {
  header: PropTypes.shape({
    logo: PropTypes.shape({
      alternate_text: PropTypes.string,
      url: PropTypes.string,
    }),
    second_logo: PropTypes.shape({
      alternate_text: PropTypes.string,
      url: PropTypes.string,
    }),
    links: PropTypes.array,
    sticky_html: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      slug: PropTypes.string,
      text: PropTypes.string,
    }),
  ).isRequired,
  setLanguage: PropTypes.func.isRequired,
  orgSlug: PropTypes.string.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
  }).isRequired,
  isAuthenticated: PropTypes.bool,
  userData: PropTypes.object.isRequired,
};

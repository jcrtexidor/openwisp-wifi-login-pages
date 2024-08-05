/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, { Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { toast } from "react-toastify";
import { t } from "ttag";
import Countdown from "react-countdown";

import getText from "../../utils/get-text";
import getHtml from "../../utils/get-html";
import "react-phone-input-2/lib/style.css";
import "react-toastify/dist/ReactToastify.css";
import { startsWith } from "lodash";
import getAssetPath from "../../utils/get-asset-path";
import getErrorText from "../../utils/get-error-text";
import getParameterByName from "../../utils/get-parameter-by-name";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import renderAdditionalInfo from "../../utils/render-additional-info";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";
import Modal from "../modal";
import { Status } from "../organization-wrapper/lazy-import";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";
import redirectToPayment from "../../utils/redirect-to-payment";
import { localStorage, sessionStorage } from "../../utils/storage";

import {
  mainToastId,
  mobilePhoneTokenStatusUrl,
  phoneLoginApiUrl,
  createPhoneLoginOTPUrl,
} from "../../constants";

const PhoneInput = React.lazy(() =>
  import(/* webpackChunkName: 'PhoneInput' */ "react-phone-input-2"),
);
export default class MobileLogin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phone_number: "",
      code: "",
      remember_me: true,
      errors: {},
      resendButtonDisabledCooldown: 0,
    };
    this.realmsRadiusLoginForm = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.hasPhoneTokenBeenSent = this.hasPhoneTokenBeenSent.bind(this);
    this.createPhoneToken = this.createPhoneToken.bind(this);
    this.activePhoneToken = this.activePhoneToken.bind(this);
    this.resendPhoneToken = this.resendPhoneToken.bind(this);
  }

  componentDidMount() {
    const phone_number = getParameterByName("phone_number");
    const token = getParameterByName("token");
    const { loginForm, setTitle, orgName, orgSlug, settings } = this.props;
    const sesame_token = getParameterByName(
      settings.passwordless_auth_token_name,
    );
    setTitle(t`LOGIN`, orgName);
    let remember_me;

    if (localStorage.getItem("rememberMe") !== null) {
      remember_me = localStorage.getItem("rememberMe") === "true";
    } else {
      remember_me = loginForm.input_fields.remember_me.value;
    }
    this.setState({ ...this.state, remember_me });
    Status.preload();

    // social login / SAML login
    if (phone_number && token) {
      const loginMethod = getParameterByName("login_method");
      if (loginMethod) {
        // we have to use localStorage because the page may be
        // closed and the information may be lost if we use sessionStorage
        localStorage.setItem(`${orgSlug}_logout_method`, loginMethod);
      }
      // will trigger token validation in status
      // autologin is disabled in this mode (user has to log in each time)
      this.handleAuthentication(
        {
          phone_number,
          key: token,
          is_active: true,
          radius_user_token: undefined,
        },
        true,
      );
    }

    // password-less authentication
    if (sesame_token) {
      this.handleSubmit(null, sesame_token);
    }
  }

  hasPhoneTokenBeenSent() {
    return sessionStorage.getItem(this.phoneTokenSentKey) !== null;
  }

  async createPhoneToken(resend = false) {
    // do not send new SMS token if one has already been sent
    if (!resend && this.hasPhoneTokenBeenSent()) {
      return false;
    }
    const { orgSlug, language, userData } = this.props;
    const { errors, phone_number } = this.state;
    const self = this;
    const url = createPhoneLoginOTPUrl(orgSlug);

    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
      },
      url,
      data: qs.stringify({
        phone_number,
      }),
    })
      .then((response) => {
        // flag SMS as sent to avoid resending it
        sessionStorage.setItem(self.phoneTokenSentKey, true);
        toast.info(t`TOKEN_SENT`);
        if (response && response.data && response.data.cooldown) {
          this.setState({ ...this.state, resendButtonDisabledCooldown: response.data.cooldown });
        }
      })
      .catch((error) => {
        const errorText = getErrorText(error);
        const { data } = error.response;
        if (data && data.cooldown) {
          this.setState({ ...this.state, resendButtonDisabledCooldown: data.cooldown });
        }
        logError(error, errorText);
        toast.error(errorText);
        this.setState({
          ...this.state,
          errors: {
            ...errors,
            ...(errorText ? { nonField: errorText } : { nonField: "" }),
          },
        });
      });
  }

  async activePhoneToken() {
    const { orgSlug, language, userData } = this.props;
    const url = mobilePhoneTokenStatusUrl(orgSlug);
    return axios({
      method: "get",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.auth_token}`,
      },
      url,
    })
      .then((data) => data.active)
      .catch((error) => {
        if (
          error.response &&
          error.response.status === 404 &&
          error.response.data &&
          error.response.data.response_code !== "INVALID_ORGANIZATION"
        ) {
          // This is kept for backward compatibility with older versions of OpenWISP RADIUS
          // that does not have API endpoint for checking phone token status.
          return false;
        }
        const errorText = getErrorText(error);
        logError(error, errorText);
        toast.error(errorText);
        return errorText;
      });
  }

  async resendPhoneToken() {
    const { errors } = this.state;
    console.log(errors);

    if (this.state.phone_number.length < 8)
      errors.phone_number = t`PHONE_VERIF_TITL`;

    this.setState({ ...this.state, errors });

    if (Object.values(errors).some(errorMessage => errorMessage.length > 0)) {
      return;
    }

    const { setLoading } = this.context;
    setLoading(true);
    await this.createPhoneToken(true);
    // reset error messages
    this.setState({
      errors: {},
      code: "",
    });
    setLoading(false);
  }

  getPhoneNumberField = (input_fields) => {
    const { phone_number, errors } = this.state;
    return (
      <div className="row phone-number">
        <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
        {getError(errors, "phone_number")}
        <Suspense
          fallback={
            <input
              type="tel"
              name="phone_number"
              className="form-control input"
              value={phone_number}
              id="phone_number"
              onChange={(value) =>
                this.handleChange({
                  target: { name: "phone_number", value: `+${value}` },
                })
              }
              required
              minLength={4}
              placeholder={t`PHONE_PHOLD`}
            />
          }
        >
          <PhoneInput
            name="phone_number"
            country={input_fields.phone_number.country || "ar"}
            onlyCountries={input_fields.phone_number.only_countries || []}
            preferredCountries={
              input_fields.phone_number.preferred_countries || []
            }
            excludeCountries={input_fields.phone_number.exclude_countries || []}
            value={phone_number}
            onChange={(value) =>
              this.handleChange({
                target: { name: "phone_number", value: `+${value}` },
              })
            }
            placeholder={t`PHONE_PHOLD`}
            enableSearch={Boolean(input_fields.phone_number.enable_search)}
            inputProps={{
              name: "phone_number",
              id: "phone_number",
              className: `form-control input ${errors.phone_number ? "error" : ""}`,
              required: true,
              autoFocus: true,
              autoComplete: "tel",
            }}
            isValid={(inputNumber, country, countries) => {
              return countries.some((country) => {
                return startsWith(inputNumber, country.dialCode) || startsWith(country.dialCode, inputNumber);
              });
            }}
          />
        </Suspense>
      </div>
    );
  };

  handleChange(event) {
    try { event.persist(); } catch (e) { } // workaround 

    this.setState({
      ...this.state,
      [event.target.name]: event.target.value,
    });

    // clean errors
    const { errors } = this.state;
    if (errors[event.target.name])
      delete errors[event.target.name];

    if (errors.nonField)
      delete errors.nonField;
  }

  handleSubmit(event, sesame_token = null) {
    const { setLoading } = this.context;

    if (event)
      event.preventDefault();

    const { orgSlug, setUserData, language, settings } = this.props;
    const { radius_realms } = settings;
    const { phone_number, code, errors } = this.state;
    const url = phoneLoginApiUrl(orgSlug);

    this.setState({ errors: {} });

    setLoading(true);
    if (!sesame_token) {
      this.waitToast = toast.info(t`PLEASE_WAIT`, { autoClose: 20000 });
    }
    if (radius_realms && phone_number.includes("@")) {
      return this.realmsRadiusLoginForm.current.submit();
    }
    const headers = {
      "content-type": "application/x-www-form-urlencoded",
      "accept-language": getLanguageHeaders(language),
    };
    if (sesame_token) {
      headers.Authorization = `${settings.passwordless_auth_token_name} ${sesame_token}`;
    }
    return axios({
      method: "post",
      headers,
      url,
      data: qs.stringify({
        phone_number,
        code,
      }),
    })
      .then((res = {}) => {
        if (!res.data) throw new Error();
        return this.handleAuthentication(res.data);
      })
      .catch((error = {}) => {
        if (!error.response || !error.response.data || !error) {
          toast.error(t`ERR_OCCUR`);
          return;
        }

        const { data } = error.response;
        if (!data) throw new Error();

        if (error.response.status === 401 && data.is_active) {
          this.handleAuthentication(data);
          return;
        }

        setUserData(data);

        const errorText =
          data.is_active === false
            ? getErrorText(error, t`USER_INACTIVE`)
            : getErrorText(error, t`LOGIN_ERR`);
        logError(error, errorText);
        toast.error(errorText);

        if (data.is_active === false) {
          data.phone_number = "";
        }

        this.setState({
          errors: {
            ...errors,
            ...(data.phone_number
              ? { phone_number: data.phone_number.toString() }
              : { phone_number: "" }),
            ...(data.code ? { code: data.code } : { code: "" }),
          },
        });

        this.dismissWait();
        setLoading(false);
      });
  }

  dismissWait = () => {
    const { waitToast } = this;
    if (waitToast) toast.dismiss(this.waitToast);
  };

  handleAuthentication = (data = {}, useSessionStorage = false) => {
    const { orgSlug, authenticate, setUserData, navigate } = this.props;
    const { remember_me } = this.state;
    // useSessionStorage=true is passed from social login or SAML
    // user needs to repeat the login process each time
    localStorage.setItem(
      "rememberMe",
      String(remember_me && !useSessionStorage),
    );
    // if remember me checkbox is unchecked
    // store auth token in sessionStorage instead of cookie
    if (!remember_me || useSessionStorage) {
      sessionStorage.setItem(`${orgSlug}_auth_token`, data.key);
    }
    this.dismissWait();
    toast.success(t`LOGIN_SUCCESS`, {
      toastId: mainToastId,
    });
    const { key: auth_token } = data;
    delete data.key; // eslint-disable-line no-param-reassign
    setUserData({ ...data, auth_token, mustLogin: true });
    // if requires payment redirect to payment status component
    if (data.method === "bank_card" && data.is_verified === false) {
      redirectToPayment(orgSlug, navigate);
    }
    authenticate(true);
    navigate(`/${orgSlug}/status`)
  };

  handleCheckBoxChange = (event) => {
    this.setState(...this.state, { remember_me: event.target.checked });
  };

  getRealmRadiusForm = () => {
    const { phone_number, code } = this.state;
    const { settings, captivePortalLoginForm } = this.props;
    const { radius_realms } = settings;
    if (radius_realms && captivePortalLoginForm)
      return (
        <form
          ref={this.realmsRadiusLoginForm}
          method={captivePortalLoginForm.method || "post"}
          id="cp-login-form"
          action={captivePortalLoginForm.action || ""}
          className="hidden"
        >
          <input
            type="hidden"
            name={captivePortalLoginForm.fields.username || ""}
            value={phone_number}
          />
          <input
            type="hidden"
            name={captivePortalLoginForm.fields.password || ""}
            value={code}
          />
          {captivePortalLoginForm.additional_fields.length &&
            captivePortalLoginForm.additional_fields.map((field) => (
              <input
                type="hidden"
                name={field.name}
                value={field.value}
                key={field.name}
              />
            ))}
        </form>
      );
    return null;
  };

  render() {
    const { errors, code, remember_me, resendButtonDisabledCooldown } = this.state;
    const { loginForm, orgSlug, language } = this.props;
    const {
      links,
      buttons,
      input_fields,
      social_login,
      additional_info_text,
      intro_html,
      pre_html,
      help_html,
      after_html,
    } = loginForm;

    return (
      <>
        {intro_html && (
          <div className="container intro">
            {getHtml(intro_html, language, "inner")}
          </div>
        )}
        <div className="container content" id="login">
          <div className="inner">
            <form className="main-column" onSubmit={this.handleSubmit}>
              <div className="inner">
                {getHtml(pre_html, language, "pre-html")}
                {getHtml(help_html, language, "help-container")}

                <div className="fieldset">
                  {getError(errors)}

                  {this.getPhoneNumberField(input_fields)}


                  <div className="row">
                    {getError(errors, "code")}
                    <input
                      className={`input ${errors.code || errors.nonField ? "error" : ""
                        }`}
                      type="text"
                      id="code"
                      required
                      name="code"
                      value={code}
                      onChange={this.handleChange}
                      placeholder={t`MOBILE_CODE_PHOLD`}
                      pattern={input_fields.code.pattern}
                      title={t`MOBILE_CODE_TITL`}
                    />
                  </div>

                  <div className="row resend">
                    <p className="label">
                      {resendButtonDisabledCooldown === 0 ? (
                        t`RESEND_TOKEN_LBL`
                      ) : (
                        <Countdown
                          date={Date.now() + resendButtonDisabledCooldown * 1000}
                          renderer={({ seconds }) => t`RESEND_TOKEN_WAIT_LBL${seconds}`}
                          onComplete={() => this.setState({ ...this.state, resendButtonDisabledCooldown: 0 })}
                        />
                      )}
                    </p>

                    <button
                      type="button"
                      className="button full"
                      onClick={this.resendPhoneToken}
                      disabled={Boolean(resendButtonDisabledCooldown)}
                    >
                      {t`RESEND_TOKEN`}
                    </button>
                  </div>


                  <div className="row remember-me">
                    <input
                      type="checkbox"
                      id="remember_me"
                      name="remember_me"
                      checked={remember_me}
                      onChange={this.handleCheckBoxChange}
                    />
                    <label htmlFor="remember_me">{t`REMEMBER_ME`}</label>
                  </div>
                </div>

                {additional_info_text && (
                  <div className="row add-info">
                    {renderAdditionalInfo(
                      t`LOGIN_ADD_INFO_TXT`,
                      orgSlug,
                      "login",
                    )}
                  </div>
                )}

                <div className="row login">
                  <input
                    type="submit"
                    className="button full"
                    value={t`LOGIN`}
                    disabled={!Boolean(resendButtonDisabledCooldown)}
                  />
                </div>
                {getHtml(after_html, language, "after-html")}
              </div>
            </form>

            {this.getRealmRadiusForm()}
          </div>
        </div>
        <Routes>
          <Route
            path=":name"
            element={<Modal prevPath={`/${orgSlug}/login`} />}
          />
        </Routes>
      </>
    );
  }
}

MobileLogin.contextType = LoadingContext;
MobileLogin.propTypes = {
  loginForm: PropTypes.shape({
    social_login: PropTypes.shape({
      divider_text: PropTypes.object,
      description: PropTypes.object,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
          icon: PropTypes.string.isRequired,
          text: PropTypes.object.isRequired,
        }),
      ),
    }),
    input_fields: PropTypes.shape({
      phone_number: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string,
        label: PropTypes.object,
        placeholder: PropTypes.object,
      }).isRequired,
      code: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
      phone_number: PropTypes.shape({
        type: PropTypes.string,
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      remember_me: PropTypes.shape({
        value: PropTypes.bool.isRequired,
      }),
    }),
    additional_info_text: PropTypes.bool,
    buttons: PropTypes.shape({
      register: PropTypes.bool,
    }),
    links: PropTypes.shape({
      forget_password: PropTypes.bool,
    }).isRequired,
    pre_html: PropTypes.object,
    intro_html: PropTypes.object,
    help_html: PropTypes.object,
    after_html: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  authenticate: PropTypes.func.isRequired,
  setUserData: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    radius_realms: PropTypes.bool,
    mobile_phone_verification: PropTypes.bool,
    subscriptions: PropTypes.bool,
    passwordless_auth_token_name: PropTypes.string,
  }).isRequired,
  setTitle: PropTypes.func.isRequired,
  captivePortalLoginForm: PropTypes.shape({
    method: PropTypes.string,
    action: PropTypes.string,
    fields: PropTypes.shape({
      username: PropTypes.string,
      password: PropTypes.string,
    }),
    additional_fields: PropTypes.array,
  }).isRequired,
  navigate: PropTypes.func.isRequired,
};

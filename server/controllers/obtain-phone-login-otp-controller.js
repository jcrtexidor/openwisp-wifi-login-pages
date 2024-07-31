import axios from "axios";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import { logResponseError } from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";
import sendCookies from "../utils/send-cookies";


const isObject = (value) => {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && !(value instanceof RegExp)
    && !(value instanceof Date)
    && !(value instanceof Set)
    && !(value instanceof Map)
}

const obtainPhoneLoginOTP = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const { host } = conf;
      const url = reverse("phone_login_otp", getSlug(conf));
      const timeout = conf.timeout * 1000;

      const headers = {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": req.headers["accept-language"],
      }
      if (req.headers.authorization)
        headers.Authorization = req.headers.authorization;

      // make AJAX request
      axios({
        method: "post",
        headers,
        url: `${host}${url}/`,
        timeout,
        data: qs.stringify({ 'phone_number': req.body.phone_number }),
      })
        .then((response) => {
          // delete response.data.auth_token;
          res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
        .catch((error) => {
          logResponseError(error);
          if (error.response.status === 500) {
            res
              .status(500)
              .type("application/json")
              .send({ detail: "Internal Server Error.", });
          }
          const data = error.response.data;
          const detail = isObject(data) ? Object.values(data).join(" ") : data;
          res
            .status(error.response.status)
            .type("application/json")
            .send({ detail });
        });
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res
      .status(404)
      .type("application/json")
      .send({ detail: "Not found.", });
  }
};

/*
const obtainAccessToken = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const obtainAccessTokenUrl = reverse("user_auth_access_token", getSlug(conf));
      const timeout = 15000;
      const {username, cell_code} = req.body;

      const headers = {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": req.headers["accept-language"],
      };

      if (req.headers.authorization)
        headers.Authorization = req.headers.authorization;

      // console.log("")

      // return res.status(200).type("application/json").send({});

      // make AJAX request
      // TODO: Make real token
      axios({
        method: "post",
        headers,
        url: `${host}${obtainAccessTokenUrl}/`,
        timeout,
        data: qs.stringify({username, cell_code}),
      })
        .then((response) => {
          return res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
        .catch((error) => {
          logResponseError(error);
          try {
            // unverified user recognized
            if (
              error.response.status === 401 &&
              error.response.data.is_active
            ) {
              return sendCookies(error.response, conf, res);
            }
            // forward error
            return res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            return res.status(500).type("application/json").send({
              detail: "Internal server error",
            });
          }
        });
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res.status(404).type("application/json").send({
      detail: "Not found.",
    });
  }
};
*/
export default obtainPhoneLoginOTP;

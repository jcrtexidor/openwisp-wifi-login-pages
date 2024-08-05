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

export const obtainPhoneLoginOTP = (req, res) => {
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



export const phoneLogin = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host, settings} = conf;
      const phoneLoginUrl = reverse("phone_login_token", getSlug(conf));
      const timeout = conf.timeout * 1000;
      const postData = req.body; // phone_number, code

      // send request
      axios({
        method: "post",
        headers: {
          "content-type": "application/json",
          "accept-language": req.headers["accept-language"],
        },
        url: `${host}${phoneLoginUrl}/`,
        timeout,
        data: postData,
      })
        .then((response) => sendCookies(response, conf, res))
        .catch((error) => {
          logResponseError(error);
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            res.status(500).type("application/json").send({
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


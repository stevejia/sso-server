using JWT;
using Qicheng.Common.Model;
using Qicheng.Common.Utility;
using Qicheng.Logging;
using Qicheng.Tbms.BusinessLayer.Interface.TradingSystem;
using Qicheng.Tbms.Dto;
using Qicheng.Tbms.Utility;
using Qicheng.Tbms.WebUtility;
using Qicheng.TbmsBm.BusinessLayer.Interface;
using Qicheng.TbmsBm.Web.Extensions;
using Qicheng.TbmsBm.Web.Infrastructure;
using Qicheng.TbmsBm.Web.Models;
using System;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Qicheng.TbmsBm.Web.Controllers
{
    public class AccountController : BaseController
    {
        public AccountController(IAppTenantBase appTenantBase, IConfService confService, ILogger logger, Func<ITaskConsumer> funcTaskConsumer, Func<IAppTenant> funcAppTenant, Func<IAllowAnonymousUserContext> funcAnonymousUserContext, Func<IAnonymousManagersBm> funcAnonymousManagersBm, Func<WFUser_Dto> funcWFUser_Dto, Func<IUserContext> funcUserContext, Func<ManagersProviderBm> funcManagersProviderBm, Func<ISyncFromTsManager> funcSyncFromTsManager) : base(appTenantBase, confService, logger, funcTaskConsumer, funcAppTenant, funcAnonymousUserContext, funcAnonymousManagersBm, funcWFUser_Dto, funcUserContext, funcManagersProviderBm, funcSyncFromTsManager)
        {
        }

        public ActionResult Index()
        {
            (var paload, var token) = TokenGenerator.Generate(this.AppTenantBase, this.WfUserDto);
            var roleInfo = ManagersProvider.RoleManagerBm.List(new Common.QueryParameter.RoleQueryParameterBm { UserId = WfUserDto.WFUserId });
            var highestAuthority = 0;
            roleInfo.ForEach(x =>
            {
                if (x.Module.HasValue)
                {
                    highestAuthority = x.Module.Value | highestAuthority;
                }
            });
            var sysConfigs = ManagersProvider.SystemConfigurationManagerBm.List()
                .Where(x => x.WFKey == "BMSiteURL" || x.WFKey == "WebSiteURL" || x.WFKey == "AccountingSiteURL" || x.WFKey == "TpmsUrl" || x.WFKey == "HedgeSiteURL" || x.WFKey == "SettlementSiteURL" || x.WFKey == "MarketFeedSiteURL");
            var enums = Utilities.ArrayOf(
                 typeof(RouteContextModule)
                 ).Distinct().ToDictionary(x => x.Name, x => x.EnumToDictionary());
            var editionModules = RelationUtil.GetEditionModules();
            ViewBag.enums = enums;
            ViewBag.token = token;
            ViewBag.highestAuthority = highestAuthority;
            ViewBag.isAdmin = this.UserContext.IsAdmin;
            ViewBag.sysConfigs = sysConfigs;
            ViewBag.editionModules = editionModules;

            return View();
        }

        [OverrideAuthentication]
        [AllowAnonymous]
        public ActionResult Login(string returnUrl, RouteContextModule? module)
        {
            ViewBag.Module = module;
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        [HttpPost]
        [OverrideAuthentication]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult Login(LoginModel model, string returnUrl, RouteContextModule? module)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    //非admin不允许登录
                    //if (!string.Equals(ConstValues.AdminName, model.Username, StringComparison.OrdinalIgnoreCase))
                    //{
                    //    throw new BaseCustomException(ErrorMessages.UserLoginWithoutPermission);
                    //}
                    AnonymousManagersProvider.UserManagerBm.ValidationForPasswordLogin(model.Username,
                        model.Password,
                        this.Request.GetClientIpv4Address(),
                        this.Request.UserAgent
                        );

                    FormsAuthentication.SetAuthCookie(model.Username, true);
                    var userInDb = AnonymousManagersProvider.UserManagerBm.GetByUsername(model.Username);
                    var cookie = new HttpCookie("UserInfo");
                    cookie.HttpOnly = true;

                    cookie.Values["LoginName"] = HttpUtility.UrlEncode(userInDb.LoginName, Encoding.UTF8);
                    // cookie for signalR
                    cookie.Values["UserId"] = userInDb.WFUserId.ToString();
                    cookie.Expires = DateTime.Now.AddDays(92);
                    HttpContext.Response.Cookies.Remove("UserInfo");
                    HttpContext.Response.Cookies.Add(cookie);

                    //if (!(Url.IsLocalUrl(returnUrl) && returnUrl.Length > 1 && returnUrl.StartsWith("/")
                    //    && !returnUrl.StartsWith("//") && !returnUrl.StartsWith("/\\")))
                    //{
                    //    returnUrl = Url.Action("Index", "Account");
                    //}

                    if (!string.IsNullOrEmpty(returnUrl) && module.HasValue)
                    {
                        if (module.Value == RouteContextModule.Project || module.Value == RouteContextModule.Hedge || module.Value == RouteContextModule.Accounting || module.Value == RouteContextModule.MarketFeed || module.Value == RouteContextModule.Settlement)
                        {
                            JwtPayloadModel payload;
                            string token = "";
                            if (userInDb == null && !WfUserDto.LoginName.IsNullOrEmpty())
                            {
                                (payload, token) = TokenGenerator.Generate(this.AppTenantBase, this.WfUserDto);
                            }
                            else
                            {
                                (payload, token) = TokenGenerator.Generate(this.AppTenantBase, userInDb);
                            }
                            if (!returnUrl.Contains("?"))
                            {
                                returnUrl += "?token=" + token;
                            }
                            else
                            {
                                var splitReturnUrl = returnUrl.Split('?');
                                var others = splitReturnUrl.Where((x, i) => i != 0).ToList();
                                var main = splitReturnUrl[0];
                                returnUrl = main + "?token=" + token + "&" + others.StringJoin("?");
                            }
                        }
                    }

                    return Json(new { status = true, returnUrl = returnUrl }, JsonRequestBehavior.DenyGet);
                }
                catch (Exception ex)
                {
                    this.Logger.LogError(ex);
                    return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.DenyGet);
                }
            }
            else
            {
                return Json(new { status = false, message = Messages.用户名或口令有误 + "\n" + string.Join("\n", this.ModelState.SelectMany(x => x.Value.Errors).Select(x => x.ErrorMessage)), }, JsonRequestBehavior.DenyGet);
            }
        }

        [AllowAnonymous]
        public ActionResult SSOLogin(LoginModel model)
        {
            var cookie3 = HttpContext.Response.Cookies.Get(model.Username);

            var cookie2 = HttpContext.Request.Cookies.Get(model.Username);
            if (ModelState.IsValid)
            {
                try
                {
                    //非admin不允许登录
                    //if (!string.Equals(ConstValues.AdminName, model.Username, StringComparison.OrdinalIgnoreCase))
                    //{
                    //    throw new BaseCustomException(ErrorMessages.UserLoginWithoutPermission);
                    //}
                    AnonymousManagersProvider.UserManagerBm.ValidationForPasswordLogin(model.Username,
                        model.Password,
                        this.Request.GetClientIpv4Address(),
                        this.Request.UserAgent
                        );
                    var userInDb = AnonymousManagersProvider.UserManagerBm.GetByUsername(model.Username);
                    JwtPayloadModel payload;
                    string token = "";
                    (payload, token) = TokenGenerator.Generate(this.AppTenantBase, userInDb);
                    var cookie = new HttpCookie(model.Username);
                    cookie.HttpOnly = true;

                    cookie.Values["token"] = token;
                    // cookie for signalR
                    cookie.Values["UserId"] = userInDb.WFUserId.ToString();
                    cookie.Expires = DateTime.Now.AddDays(92);
                    HttpContext.Response.Cookies.Remove(model.Username);
                    HttpContext.Response.Cookies.Add(cookie);
                    return Json(new { token }, JsonRequestBehavior.DenyGet);
                }
                catch (Exception ex)
                {
                    this.Logger.LogError(ex);
                    return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.DenyGet);
                }
            }
            else
            {
                return Json(new { status = false, message = Messages.用户名或口令有误 + "\n" + string.Join("\n", this.ModelState.SelectMany(x => x.Value.Errors).Select(x => x.ErrorMessage)), }, JsonRequestBehavior.DenyGet);
            }
        }
        [AllowAnonymous]
        public ActionResult CheckLogin(string oldToken)
        {
            var result = new ReturnInfo();
            try
            {
                var model = TokenGenerator.Decode(oldToken);
                var newToken = TokenGenerator.Generate(model);
                result.Data = new { newToken };
            }
            catch (TokenExpiredException)
            {
                result.Message = "token 已过期";
                result.ReturnStatus = ReturnStatus.Fail;
            }
            catch (SignatureVerificationException)
            {
                result.Message = "token 签名无效";
                result.ReturnStatus = ReturnStatus.Fail;
            }
            return Json(result, JsonRequestBehavior.AllowGet);
        }
        [AllowAnonymous]
        public ActionResult RefreshAntiForgeryToken()
        {
            string cookieToken;
            string formToken;
            System.Web.Helpers.AntiForgery.GetTokens(null, out cookieToken, out formToken);
            string cookieName = "__RequestVerificationToken";
            if (Response.Cookies.AllKeys.Contains(cookieName))
            {
                Response.Cookies[cookieName].Value = cookieToken;
            }
            else
            {
                Response.Cookies.Add(new HttpCookie(cookieName, cookieToken));
            }
            return Json(formToken, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult LogOff()
        {
            var mainLoginUrl = ManagersProvider.SystemConfigurationManagerBm.Get("BMSiteURL", false)?.WFValue + "/Account/Login";
            this.SignOut();

            var result = new ReturnInfo
            {
                Data = new { mainLoginUrl }
            };
            return Json(result, JsonRequestBehavior.DenyGet);
        }

        public ActionResult ChangePassword()
        {
            ViewBag.Message = "";
            return View();
        }

        [HttpPost]
        public ActionResult ChangePassword(ChangePasswordViewModel model)
        {
            ViewBag.Message = "";
            if (ModelState.IsValid)
            {
                try
                {
                    ManagersProvider.UserManagerBm.ChangePassword(UserContext.UserId, model.OldPassword, model.NewPassword);
                    //ViewBag.Message = "密码已更改。";
                    return Json(new ReturnInfo(), JsonRequestBehavior.DenyGet);
                }
                catch (Exception ex)
                {
                    return Json(new ReturnInfo() { Message = ex.Message }, JsonRequestBehavior.DenyGet);
                }
            }
            return Json(new ReturnInfo(), JsonRequestBehavior.DenyGet);
        }

        [AllowAnonymous]
        [HttpGet]
        public ActionResult ForgetPassword(string userName)
        {
            ViewBag.userName = userName;
            return View();
        }

        [AllowAnonymous]
        [HttpPost]
        public ActionResult ResetPassword(string userName)
        {
            var siteUrl = AnonymousManagersProvider.SystemConfigurationManagerBm.GetValueByParameter(SystemConfigurationKey.BMSiteURL, null);
            if (string.IsNullOrEmpty(siteUrl))
            {
                throw new BaseCustomException(Messages.未正确配置管理站的站点地址);
            }
            Func<string, string> getUrlByCodes = codes => siteUrl.TrimEnd('/') + Url.Action("ChangePasswordFromMail", "Account", new { info = codes, });

            var wfuser = AnonymousManagersProvider.UserManagerBm.GetByUsername(userName);
            string desSecretKey = this.ConfService.DesSecretKey;
            var encryptor = new DesCryptoHelper(desSecretKey);
            AnonymousManagersProvider.UserManagerBm.SendMailForResetPassword(wfuser, getUrlByCodes, encryptor);
            var mailAddress = wfuser.MailAddress;
            // 最后@匹配符的位置
            var index = mailAddress.LastIndexOf("@");
            var mailHash = mailAddress.Replace(mailAddress.Substring(index > 3 ? 3 : index - 1, index > 3 ? index - 3 : 1), "***");
            var result = new ReturnInfo { Data = mailHash };
            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [AllowAnonymous]
        [HttpGet]
        public ActionResult ChangePasswordFromMail(string info)
        {
            string desSecretKey = this.ConfService.DesSecretKey;
            var decryptor = new DesCryptoHelper(desSecretKey);
            var result = ExceptionUtil.OmitException(new WFSafetyLink_Dto(), () => AnonymousManagersProvider.UserManagerBm.GetByLogonCodes(info, decryptor), true, Logger);
            int userId = result.Item1.WFUserId;
            string returnInfoMsg = result.Item2?.Message;
            var tenantCode = AppTenant.AppTenantCode;
            WFUser_Dto user = AnonymousManagersProvider.UserManagerBm.Get(userId, false);
            ViewBag.userId = userId;
            ViewBag.returnInfoMsg = returnInfoMsg;
            ViewBag.user = user;
            ViewBag.codes = info;
            ViewBag.tenant = tenantCode;
            return View();
        }

        //[AllowAnonymous]
        //[HttpPost]
        //// 匿名api，参数只有userId，newPassword；不安全！
        //public ActionResult ChangePasswordFromMail(int userId, string newPassword)
        //{
        //    AnonymousManagersProvider.UserManagerBm.SetPassword(userId, newPassword);
        //    var result = new ReturnInfo { };
        //    return Json(result, JsonRequestBehavior.AllowGet);
        //}

        [AllowAnonymous]
        [HttpPost]
        public ActionResult ChangePasswordByCode(string codes, string passwordNew)
        {
            string desSecretKey = this.ConfService.DesSecretKey;
            var decryptor = new DesCryptoHelper(desSecretKey);
            AnonymousManagersProvider.UserManagerBm.ChangePasswordByCode(codes, passwordNew, decryptor);
            return JsonNet();
        }

        private void ConfLocaleCookieImpl(string l)
        {
            if (LangTagConf.SuportedLangTagCultureDict.Value.ContainsKey(l))
            {
                var cookie = new HttpCookie(WebExtensions.LocaleFromCookiesKey) { HttpOnly = false, Expires = DateTime.Today.AddDays(365), };
                cookie.Values[WebExtensions.LocaleFromCookieSubKey] = l;
                if (Response.Cookies.AllKeys.Contains(cookie.Name))
                {
                    Response.SetCookie(cookie);
                }
                else
                {
                    Response.AppendCookie(cookie);
                }
            }
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult ConfLocaleCookie(string l)
        {
            ConfLocaleCookieImpl(l);
            return this.Redirect(Request.UrlReferrer.AbsoluteUri);
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult ConfLocaleCookieAjax(string l)
        {
            ConfLocaleCookieImpl(l);
            return this.JsonNet(LangTagConf.GetLocales);
        }

        [HttpGet]
        [AllowAnonymous]
        public ActionResult Locales()
        {
            return this.JsonNet(LangTagConf.GetLocales);
        }
    }
}

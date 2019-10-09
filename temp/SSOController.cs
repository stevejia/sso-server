using JWT;
using Qicheng.Common.Model;
using Qicheng.Common.Utility;
using Qicheng.Logging;
using Qicheng.Tbms.BusinessLayer.Interface.TradingSystem;
using Qicheng.Tbms.Dto;
using Qicheng.Tbms.Utility;
using Qicheng.Tbms.WebUtility;
using Qicheng.TbmsBm.BusinessLayer.Interface;
using Qicheng.TbmsBm.Web.Infrastructure;
using Qicheng.TbmsBm.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;

namespace Qicheng.TbmsBm.Web.Controllers
{
    public class SSOController : BaseController
    {
        public SSOController(IAppTenantBase appTenantBase, IConfService confService, ILogger logger, Func<ITaskConsumer> funcTaskConsumer, Func<IAppTenant> funcAppTenant, Func<IAllowAnonymousUserContext> funcAnonymousUserContext, Func<IAnonymousManagersBm> funcAnonymousManagersBm, Func<WFUser_Dto> funcWFUser_Dto, Func<IUserContext> funcUserContext, Func<ManagersProviderBm> funcManagersProviderBm, Func<ISyncFromTsManager> funcSyncFromTsManager) : base(appTenantBase, confService, logger, funcTaskConsumer, funcAppTenant, funcAnonymousUserContext, funcAnonymousManagersBm, funcWFUser_Dto, funcUserContext, funcManagersProviderBm, funcSyncFromTsManager)
        {
        }
        [AllowAnonymous]
        public ActionResult Login(LoginModel model)
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
        public ActionResult Check(string oldToken)
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
                return new HttpStatusCodeResult((int)HttpStatusCode.Unauthorized, "token 已过期");
            }
            catch (SignatureVerificationException)
            {
                return new HttpStatusCodeResult((int)HttpStatusCode.Unauthorized, "token 签名无效");
            }
            return Json(result, JsonRequestBehavior.AllowGet);
        }
    }
}

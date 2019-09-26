using Qicheng.Common.Model;
using Qicheng.Common.Utility;
using Qicheng.Tbms.Dto;
using Qicheng.Tbms.Utility;
using Qicheng.Tbms.WebUtility;
using System.Configuration;

namespace Qicheng.TbmsBm.Web.Infrastructure
{
    public static class TokenGenerator
    {
        public static (JwtPayloadModel payload, string token) Generate(IAppTenantBase tenantBase, IUserContextBase user)
        {
            return JwtUtil.Generate(
                tenantBase.AppTenantCode,
                user.UserId,
                user.Username,
                ConfigurationManager.AppSettings["JWTsecret"],
                ConfigurationManager.AppSettings["JWTexpireMinutes"].ParseDouble() ?? 20,
                (user as IUserModelBase)?.DisplayName
                );
        }

        public static string Generate(JwtPayloadModel data)
        {
            var (payload, token) = JwtUtil.Generate(
               data.AppTenantCode,
               data.UserId,
               data.Username,
               ConfigurationManager.AppSettings["JWTsecret"],
               ConfigurationManager.AppSettings["JWTexpireMinutes"].ParseDouble() ?? 20,
               data.DisplayName
               );
            return token;
        }

        public static JwtPayloadModel Decode(string token)
        {
            return JwtUtil.DecodeTokenGeneric<JwtPayloadModel>(token, ConfigurationManager.AppSettings["JWTsecret"]);
            //Dictionary<string, object> data = null;
            //try
            //{
            //    IJsonSerializer serializer = new JsonNetSerializer();
            //    IDateTimeProvider provider = new UtcDateTimeProvider();
            //    IJwtValidator validator = new JwtValidator(serializer, provider);
            //    IBase64UrlEncoder urlEncoder = new JwtBase64UrlEncoder();
            //    IJwtDecoder decoder = new JwtDecoder(serializer, validator, urlEncoder);
            //    data = decoder.DecodeToObject<Dictionary<string, object>>(token, secret, verify: true);//token为之前生成的字符串
            //}
            //catch (TokenExpiredException)
            //{
            //    data = null;
            //}
            //catch (SignatureVerificationException)
            //{
            //    data = null;
            //}
            //return data;
        }

        //public static bool Validate(string token)
        //{
        //    var data = Decode(token);
        //    return data != null;
        //}
    }
}

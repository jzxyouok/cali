package api

import (
	"github.com/google/uuid"
	"github.com/jiangmitiao/cali/app/models"
	"github.com/jiangmitiao/cali/app/rcali"
	"github.com/revel/revel"
	"strconv"
	"time"
)

type User struct {
	*revel.Controller
}

// /user
func (c User) Index() revel.Result {
	return c.RenderJSONP(c.Request.FormValue("callback"), models.NewOKApi())
}

func (c User) Login() revel.Result {
	callback := c.Request.FormValue("callback")
	var loginName string
	var loginPassword string
	c.Params.Bind(&loginName, "loginName")
	c.Params.Bind(&loginPassword, "loginPassword")
	if loginName == "" || loginPassword == "" {
		errStatus := models.NewErrorApiWithMessageAndInfo("用户名或密码错误", nil)
		errStatus.StatusCode = 401
		return c.RenderJSONP(callback, errStatus)
	}

	if userInfo, exist := userService.GetUserByLoginName(loginName); exist && userInfo.LoginPassword == rcali.Sha3_256(loginPassword+userInfo.Salt) {
		//if exist and password correct
		loginSession := rcali.Sha3_256(userInfo.LoginPassword + strconv.FormatInt(time.Now().Unix(), 10))
		userService.FreshLoginSession(loginSession, userInfo.Id)
		return c.RenderJSONP(callback, models.NewOKApiWithMessageAndInfo("login success", loginSession))
	} else {
		errStatus := models.NewErrorApiWithMessageAndInfo("用户名或密码错误", nil)
		errStatus.StatusCode = 402
		return c.RenderJSONP(callback, errStatus)
	}
}

//get userinfo by session
func (c User) Info() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	user, has := userService.GetLoginUser(session)
	if has {
		user.Salt = ""
		user.LoginPassword = ""
		return c.RenderJSONP(callback, models.NewOKApiWithInfo(user))
	} else {
		return c.RenderJSONP(callback, models.NewErrorApi())
	}

}

//find a session is or not login
func (c User) IsLogin() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	id, _ := rcali.GetUserIdByLoginSession(session)
	if id == "" {
		return c.RenderJSONP(callback, models.NewErrorApi())
	} else {
		return c.RenderJSONP(callback, models.NewOKApi())
	}
}

//delete the server's login cache
func (c User) Logout() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	rcali.DeleteLoginSession(session)
	return c.RenderJSONP(callback, models.NewOKApi())
}

//regist a user ,if delete watcherUserRegist in role action ,then not allow to regist
func (c User) Regist() revel.Result {
	callback := c.Request.FormValue("callback")
	loginName := c.Request.FormValue("loginName")
	loginPassword := c.Request.FormValue("loginPassword")
	if loginName == "" || loginPassword == "" {
		return c.RenderJSONP(callback, models.NewErrorApiWithMessageAndInfo("not null", nil))
	} else {
		salt := uuid.New().String()
		safePassword := rcali.Sha3_256(loginPassword + salt)
		newUser := models.UserInfo{
			Id:            uuid.New().String(),
			LoginName:     loginName,
			LoginPassword: safePassword,
			Salt:          salt,
			UserName:      loginName,
			Email:         "",
		}
		if userService.Regist(newUser) {
			return c.RenderJSONP(callback, models.NewOKApi())
		} else {
			return c.RenderJSONP(callback, models.NewErrorApi())
		}
	}
}

// update userName and email by this method
func (c User) Update() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	userName := c.Request.FormValue("userName")
	email := c.Request.FormValue("email")
	if user, isLogin := userService.GetLoginUser(session); isLogin {
		user.UserName = userName
		user.Email = email
		user.Img = ""
		if updateOK := userService.UpdateInfo(user); updateOK {
			return c.RenderJSONP(callback, models.NewOKApi())
		} else {
			return c.RenderJSONP(callback, models.NewErrorApiWithMessageAndInfo("uncatched error", nil))
		}

	} else {
		return c.RenderJSONP(callback, models.NewErrorApiWithMessageAndInfo("no login", nil))
	}
}

// change the password ,need oldpassword and newpassword
func (c User) ChangePassword() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	oldLoginPassword := c.Request.FormValue("oldLoginPassword")
	loginPassword := c.Request.FormValue("loginPassword")
	if user, isLogin := userService.GetLoginUser(session); isLogin {
		if user.LoginPassword == rcali.Sha3_256(oldLoginPassword+user.Salt) {
			//oldpassword is ok
			user.Salt = uuid.New().String()
			user.LoginPassword = rcali.Sha3_256(loginPassword + user.Salt)
			if changed := userService.UpdatePassword(user); changed {
				return c.RenderJSONP(callback, models.NewOKApi())
			} else {
				return c.RenderJSONP(callback, models.NewErrorApiWithMessageAndInfo("uncatched error", nil))
			}
		} else {
			return c.RenderJSONP(callback, models.NewErrorApiWithMessageAndInfo("old password error", nil))
		}
	} else {
		return c.RenderJSONP(callback, models.NewErrorApiWithMessageAndInfo("no login", nil))
	}
}

func (c User) QueryUserCount() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	if user, isLogin := userService.GetLoginUser(session); isLogin {
		role := userRoleService.GetRoleByUser(user.Id)
		if role.Name == "admin" {
			return c.RenderJSONP(callback, models.NewOKApiWithInfo(userService.QueryUserCount("")))
		}
	}
	return c.RenderJSONP(callback, models.NewErrorApi())
}

func (c User) QueryUser() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	limit, _ := strconv.Atoi(rcali.ValueOrDefault(c.Request.FormValue("limit"), rcali.UserListNumsStr))
	start, _ := strconv.Atoi(rcali.ValueOrDefault(c.Request.FormValue("start"), "0"))

	if user, isLogin := userService.GetLoginUser(session); isLogin {
		role := userRoleService.GetRoleByUser(user.Id)
		if role.Name == "admin" {
			return c.RenderJSONP(callback, models.NewOKApiWithInfo(userService.QueryUser("", limit, start)))
		}
	}
	return c.RenderJSONP(callback, models.NewErrorApi())
}

func (c User) Delete() revel.Result {
	callback := c.Request.FormValue("callback")
	session := c.Request.FormValue("session")
	userId := c.Request.FormValue("userId")

	if user, isLogin := userService.GetLoginUser(session); isLogin {
		role := userRoleService.GetRoleByUser(user.Id)
		if role.Name != "admin" {
			//delete login user
			go rcali.DeleteLoginUserId(userId)
			return c.RenderJSONP(callback, models.NewOKApiWithInfo(userService.DeleteUser(userId)))
		}
	}
	return c.RenderJSONP(callback, models.NewErrorApi())
}

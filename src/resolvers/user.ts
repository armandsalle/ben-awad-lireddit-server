import { User } from "../entities/User"
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql"
import argon2 from "argon2"
import { MyContext } from "../types"
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants"
// import Joi from "joi"
import { UsernamePasswordInput } from "./UsernamePasswordInput"
import { validateRegister } from "../utils/validateRegister"
import { sendEmail } from "../utils/sendEmail"
import { v4 } from "uuid"

/* const UsernamePasswordInputShema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
}) */

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserReponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { em, redis }: MyContext) {
    const user = await em.findOne(User, { email })

    if (!user) {
      // email not in db
      return true
    }

    const token = v4()

    await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, "ex", 1000 * 60 * 60 * 24 * 3)

    sendEmail(email, `<a href="localhost:3000/change-password/${token}">reset password</a>`)

    return true
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null
    }

    return await em.findOne(User, { id: req.session.userId })
  }

  @Mutation(() => UserReponse)
  async register(@Arg("options") options: UsernamePasswordInput, @Ctx() { em, req }: MyContext): Promise<UserReponse> {
    /*     const validatedData = UsernamePasswordInputShema.validate(options)
    console.log(validatedData) */

    const errors = validateRegister(options)

    if (errors) {
      return { errors }
    }

    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: options.email,
    })

    try {
      await em.persistAndFlush(user)
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username or email already taken",
            },
          ],
        }
      }
    }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserReponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserReponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@") ? { email: usernameOrEmail } : { username: usernameOrEmail }
    )

    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username doesn't exist",
          },
        ],
      }
    }

    const valid = await argon2.verify(user.password, password)

    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      }
    }

    req.session.userId = user.id

    return {
      user,
    }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME)

        if (err) {
          console.log(err)
          resolve(false)
          return
        }

        resolve(true)
      })
    )
  }
}

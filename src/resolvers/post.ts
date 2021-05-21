import { Post } from "../entities/Post"
import { Arg, Int, Mutation, InputType, Query, Resolver, Field, Ctx, UseMiddleware } from "type-graphql"
import { MyContext } from "src/types"
import { isAuth } from "../middleware/isAuth"

@InputType()
class PostInput {
  @Field()
  title: string

  @Field()
  text: string
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find()
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id)
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(@Arg("input", () => PostInput) input: PostInput, @Ctx() { req }: MyContext): Promise<Post> {
    return Post.create({ ...input, creatorId: req.session.userId }).save()
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id)

    if (!post) {
      return null
    }

    if (typeof title !== "undefined") {
      await Post.update({ id }, { title })
    }

    return post
  }

  @Mutation(() => Boolean, { nullable: true })
  @UseMiddleware(isAuth)
  async deletePost(@Arg("id", () => Int) id: number): Promise<Boolean> {
    try {
      await Post.delete(id)
    } catch (error) {
      return false
    }
    return true
  }
}

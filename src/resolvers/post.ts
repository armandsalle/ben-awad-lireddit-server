import { Post } from "../entities/Post"
import { Arg, Int, Mutation, Query, Resolver } from "type-graphql"

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
  async createPost(@Arg("title", () => String) title: string): Promise<Post> {
    return Post.create({ title }).save()
  }

  @Mutation(() => Post, { nullable: true })
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
  async deletePost(@Arg("id", () => Int) id: number): Promise<Boolean> {
    try {
      await Post.delete(id)
    } catch (error) {
      return false
    }
    return true
  }
}

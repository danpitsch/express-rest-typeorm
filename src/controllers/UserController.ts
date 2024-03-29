import { AppDataSource } from "../data-source";
import { Request, Response } from "express";
import { validate } from "class-validator";
import { User } from "../entities/User";

export class UserController {

  //Get user from the database
  // private userRepository = AppDataSource.getRepository(User)

  static async listAll(req: Request, res: Response) {
    //Get users from database
    const userRepository = AppDataSource.getRepository(User)
    try {
      const users = await userRepository.find({
        select: {
          id: true,
          username: true,
          role: true
        }
      });
      //Send the users object
      res.send(users);
    } catch (error) {
      res.status(404).send("Error searching for users: " + error.message);
    }
};

  static async getOneById(req: Request, res: Response) {
    //Get the ID from the url
    const uid: number = parseInt(req.params.id);
    //Get the user from database
    const userRepository = AppDataSource.getRepository(User)
    try {
      const user = await userRepository.findOneOrFail({
        select: {
          id: true,
          username: true,
          role: true
        },
        where: {
          id: uid
        }
      });
      //Send the user object
      res.send(user);
    } catch (error) {
      res.status(404).send("Error searching for user: " + error.message);
    }
  };

  static async newUser(req: Request, res: Response) {
    //Get parameters from the body
    let { username, password, role } = req.body;
    let user = new User();
    user.username = username;
    user.password = password;
    user.role = role;

    //Validade if the parameters are ok
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    //Hash the password, to securely store on DB
    user.hashPassword();

    const userRepository = AppDataSource.getRepository(User)
    //Try to save. If fails, the username is already in use
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send(e);
      return;
    }

    //If all ok, send 201 response
    res.status(201).send("User created");
  };

  static async editUser(req: Request, res: Response) {
    //Get the ID from the url
    const uid = req.params.id;

    //Get values from the body
    const { username, role } = req.body;

    //Try to find user on database
    const userRepository = AppDataSource.getRepository(User)
    let user: User;
    try {
      user = await userRepository.findOneOrFail(uid);
    } catch (error) {
      //If not found, send a 404 response
      res.status(404).send("User not found");
      return;
    }

    //Validate the new values on model
    user.username = username;
    user.role = role;
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    //Try to safe, if fails, that means username already in use
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send("username already in use");
      return;
    }
    //After all send a 204 (no content, but accepted) response
    res.status(204).send();
  };

  static async deleteUser(req: Request, res: Response) {
    //Get the ID from the url
    const uid = req.params.id;

    const userRepository = AppDataSource.getRepository(User)
    try {
      await userRepository.findOneOrFail(uid);
    } catch (error) {
      res.status(404).send("User not found");
      return;
    }
    userRepository.delete(uid);

    //After all send a 204 (no content, but accepted) response
    res.status(204).send();
  };
};

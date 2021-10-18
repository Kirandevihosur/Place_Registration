const HttpError = require('../models/http-error');
const {validationResult} = require('express-validator');
const Place = require('../models/places');
const User = require('../models/users');
const mongoose = require('mongoose');
const mongooseUniqueValidator = require('mongoose-unique-validator');

const getPlacebyId = async(req,res,next) =>{
    const placeId = req.params.pid; //{pid: 'p1'}
        
    let place;
    try{
        place = await Place.findById(placeId);
    }
    catch(err){
        const error = new HttpError(
        'Something went wrong, could not find a place.',500
        );
        return next(error);
    }
       
        if(!place){
           const error =  new HttpError('Could not find a place for the provided id.', 404); 
           return next(error);
        }
        res.json({place: place.toObject({getters: true})}); // => {place} => {place:place} if attribute and value are same then shortcut method
        //getters: true -> removes _id and converts to string id
}

const getPlacesbyUserId = async (req,res,next)=>{
    const userId = req.params.uid;
    
    let places;
    try{
        places = await Place.find({creater: userId});
    }
    catch(err){
        const error = new HttpError('Fetching places failed, please try again later ',500);
        return next(err);
    }


    if(!places || places.length === 0){
        return next(
            new HttpError('Could not find a place for the provided user id.',404)
        );
     }
    res.json({places: places.map(place => place.toObject({
        getters: true
    }))});

}

const createPlace = async(req,res,next) =>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors);
        throw new HttpError('Invalid Inputs passed, check data.', 422);
    }
    const { title,description,address,creater } = req.body;
    const createdPlace = new Place({
        title,
        description,
        address,
        image: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FEmpire_State_Building&psig=AOvVaw18EzwhwWdDZbFrY3zQdoSk&ust=1633773754603000&source=images&cd=vfe&ved=0CAgQjRxqFwoTCIjlitXHuvMCFQAAAAAdAAAAABAD',
        creater
    });

    let user;

    try{
        user = await User.findById(creater);
    }catch(err){
        const error = new HttpError('Creating place failed, please try again', 500);
        return next(error);
    }

    if(!user){
        const error = new HttpError('Could not find user for provided id', 404);
        return next(error);
    }

    console.log(user);
    // DUMMY_PLACES.push(createdPlace);
    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session: sess});
        user.places.push(createdPlace);
        await user.save({session: sess});
        await sess.commitTransaction();
    }
    catch(err){
        const error = new HttpError(
        'Creating place failed, please try again.',
        500
        );
      return next(error);
    }
    res.status(201).json({place: createdPlace});
};

const updatePlace = async (req,res,next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors);
        return next(
            new HttpError('Invalid Inputs passed, check data.', 422)
        );

    }

    const { title,description } = req.body;
    const placeId = req.params.pid;

    
    let place;

    try{
        place = await Place.findById(placeId);
    }
    catch(err){
        const error = new HttpError(
            'Something went wrong, could not update.', 500
        );
        return next(error);
    }

    place.title = title;
    place.description = description;

    try{
        await place.save();
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not update place.', 500
        );
        return next(error);
    }



    res.status(200).json({place: place.toObject({
        getters: true
    })});

    
}

const deletePlace = async (req,res,next) => {
    const placeId = req.params.pid;

    let place;
    try{
        place = await Place.findById(placeId).populate('creater');
    }catch(err){
        const error = new HttpError('Something went wrong, could not delete place', 500);
        return next(error);
    }

    if(!place){
        const error = new HttpError('Could not find place for this id.', 404);
        return next(error);
    }

    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session: sess});
        place.creater.places.pull(place);
        await place.creater.save({session: sess});
        await sess.commitTransaction();
    }catch(err){
        const error = new HttpError('Something went wrong, could not delete place', 500);
        return next(error);
    }

    res.status(200).json({message: 'Deleted place.'});
}

exports.getPlacebyId = getPlacebyId;
exports.getPlacesbyUserId = getPlacesbyUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
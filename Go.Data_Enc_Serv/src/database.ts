import mongoose, { model } from 'mongoose';

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);

function initiateDB() {	
    mongoose.connect('mongodb://localhost/DRM', (error) => {
        if (!error) {
            console.log('Connection w/ DB Succesful!');
        }
        else {
            console.log('Connection Error w/DB');
        }
    })
}

export { initiateDB };
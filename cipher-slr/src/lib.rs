//! A modified Single Linear Regression smart contract written in Rust.
extern crate alloc;

use oasis_contract_sdk as sdk;
use oasis_contract_sdk_storage::cell::ConfidentialCell;
use oasis_contract_sdk_storage::cell::PublicCell;
/// All possible errors that can be returned by the contract.
///
/// Each error is a triplet of (module, code, message) which allows it to be both easily
/// human readable and also identifyable programmatically.
#[derive(Debug, thiserror::Error, sdk::Error)]
pub enum Error {
    #[error("bad request")]
    #[sdk_error(code = 1)]
    BadRequest,
}

/// All possible requests that the contract can handle.
///
/// This includes both calls and queries.
#[derive(Clone, Debug, cbor::Encode, cbor::Decode)]
pub enum Request {
    #[cbor(rename = "instantiate")]
    Instantiate { },

    #[cbor(rename = "calc_coefficient")]
    CalcCoefficient { feature_one: String,  output: String },

    #[cbor(rename = "predict")]
    Predict { input: i32 },
}

/// All possible responses that the contract can return.
///
/// This includes both calls and queries.
#[derive(Clone, Debug, Eq, PartialEq, cbor::Encode, cbor::Decode)]
pub enum Response {
    #[cbor(rename = "hello")]
    Hello { greeting: String },

    #[cbor(rename = "empty")]
    Empty,
}

/// The contract type.
pub struct CipherSlr;

/// Storage cell for the counter.
const BONE: ConfidentialCell<i32> = ConfidentialCell::new(b"bone");
const BZERO: ConfidentialCell<i32> = ConfidentialCell::new(b"bzero");
const OLD_X_MEAN: ConfidentialCell<i32> = ConfidentialCell::new(b"oldxmean");
const OLD_SIZE: PublicCell<i32> = PublicCell::new(b"oldsize");
const OLD_Y_MEAN: ConfidentialCell<i32> = ConfidentialCell::new(b"oldymean");

const OLD_X_VAR: ConfidentialCell<i32> = ConfidentialCell::new(b"oldxvar");
const OLD_COVAR: ConfidentialCell<i32> = ConfidentialCell::new(b"oldcovar");

impl CipherSlr {
    fn predict_result<C: sdk::Context>(ctx: &mut C, input: i32) -> (i32, i32) {
        let b1 = BONE.get(ctx.confidential_store()).unwrap_or_default();
        let b0 = BZERO.get(ctx.confidential_store()).unwrap_or_default();
        let result = b0 + b1 * input;
        
        let size = OLD_SIZE.get(ctx.public_store()).unwrap_or_default();

        return (result,size)
    }  

    fn set_combined_stats<C: sdk::Context>(ctx: &mut C, new_x_mean: i32, new_size: i32, new_x_var: i32, new_covar:i32, new_y_mean: i32) {

        let old_size = OLD_SIZE.get(ctx.public_store()).unwrap_or_default();
        let old_x_mean= OLD_X_MEAN.get(ctx.confidential_store()).unwrap_or_default();
        let old_y_mean= OLD_Y_MEAN.get(ctx.confidential_store()).unwrap_or_default();
        
        // calculate combined mean
        let combined_size = old_size + new_size;
        let combined_x_mean = (old_size * old_x_mean + new_size * new_x_mean) / combined_size as i32;
        let combined_y_mean = (old_size * old_y_mean + new_size * new_y_mean) / combined_size as i32;
        
        // calculate combined variance
        let old_x_var = OLD_X_VAR.get(ctx.confidential_store()).unwrap_or_default();
        let combined_x_var = ((old_size - 1) * old_x_var + (new_size - 1) * new_x_var) / (combined_size - 1) as i32
                                + (old_size * new_size * (old_x_mean - new_x_mean).pow(2)) / (combined_size) * (combined_size - 1) as i32;


        // calculate combined covariance
        let old_covar = OLD_COVAR.get(ctx.confidential_store()).unwrap_or_default();
        let combined_cov = ((old_covar * old_size) + (new_covar * new_size)
                            + (old_x_mean - new_x_mean) * (old_y_mean - new_y_mean) * (old_size * new_size / combined_size  as i32)) / combined_size as i32;

        let b1 = combined_cov / combined_x_var as i32;
        let b0 = combined_y_mean - b1 * combined_x_mean;

        // update checkpoint
        BZERO.set(ctx.confidential_store(), b0);
        BONE.set(ctx.confidential_store(), b1);

        OLD_SIZE.set(ctx.public_store(), combined_size);
        OLD_X_MEAN.set(ctx.confidential_store(), combined_x_mean);
        OLD_Y_MEAN.set(ctx.confidential_store(), combined_y_mean);
        OLD_X_VAR.set(ctx.confidential_store(), combined_x_var);
        OLD_COVAR.set(ctx.confidential_store(), combined_cov);
    }
}

// Implementation of the sdk::Contract trait is required in order for the type to be a contract.
impl sdk::Contract for CipherSlr {
    type Request = Request;
    type Response = Response;
    type Error = Error;

    fn instantiate<C: sdk::Context>(ctx: &mut C, request: Request) -> Result<(), Error> {
        // This method is called during the contracts.Instantiate call when the contract is first
        // instantiated. It can be used to initialize the contract state.
        match request {
            // We require the caller to always pass the Instantiate request.
            Request::Instantiate { } => {
                BZERO.set(ctx.confidential_store(), 0);
                BONE.set(ctx.confidential_store(), 0);

                OLD_SIZE.set(ctx.public_store(), 0);
                OLD_X_MEAN.set(ctx.confidential_store(), 0);
                OLD_Y_MEAN.set(ctx.confidential_store(), 0);
                OLD_X_VAR.set(ctx.confidential_store(), 0);
                OLD_COVAR.set(ctx.confidential_store(), 0);
                Ok(())
            }
            _ => Err(Error::BadRequest),
        }
    }

    fn call<C: sdk::Context>(ctx: &mut C, request: Request) -> Result<Response, Error> {
        // This method is called for each contracts.Call call. It is supposed to handle the request
        // and return a response.
        match request {
            Request::CalcCoefficient { feature_one, output } => {
                let x: Vec<i32> = feature_one.split_whitespace()
                .map(|x_entity| x_entity.parse().unwrap())
                .collect();

                let y: Vec<i32> = output.split_whitespace()
                .map(|y_entity| y_entity.parse().unwrap())
                .collect();

                // get combined sample mean: z_mean = (n*x_mean + m*y_mean)/(n + m)
                // we only store x_mean & n
                let mut sum1 = 0;
                let mut sum2 = 0;
                let mut xmean = 0;
                let mut ymean = 0;
                for i in 0..x.len() {
                    sum1 += x[i];
                    sum2 += y[i];
                }
                xmean = sum1 / x.len() as i32;
                ymean = sum2 / y.len() as i32;

                // get combined variance
                let mut xvar = 0;
                for i in 0..x.len() {
                    xvar += (x[i] - xmean).pow(2);
                }

                // get covariance
                let mut sum = 0;
                for i in 0..x.len() {
                    sum += (x[i] - xmean) * (y[i] - ymean);
                }
                let covar = sum;

                // need to be confidentially stored
                Self::set_combined_stats(ctx, xmean, x.len() as i32, xvar, covar, ymean);

                Ok(Response::Hello {
                    greeting: format!("coefficient calculation completes"),
                })
            },
            Request::Predict { input } => {
                let resnsize= Self::predict_result(ctx, input);
                Ok(Response::Hello {
                    greeting: format!("The result is {}, predicted using {} training samples.", resnsize.0, resnsize.1),
                })
            }
            _ => Err(Error::BadRequest),
        }
    }

    fn query<C: sdk::Context>(_ctx: &mut C, _request: Request) -> Result<Response, Error> {
        // This method is called for each contracts.Query query. It is supposed to handle the
        // request and return a response.
        Err(Error::BadRequest)
    }
}

// Create the required Wasm exports required for the contract to be runnable.
sdk::create_contract!(CipherSlr);
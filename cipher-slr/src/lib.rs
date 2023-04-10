//! A modified Single Linear Regression smart contract written in Rust.
extern crate alloc;

use oasis_contract_sdk as sdk;
use oasis_contract_sdk_storage::cell::ConfidentialCell;

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

impl CipherSlr {
    fn predict_result<C: sdk::Context>(ctx: &mut C, input: i32) -> i32 {
        let b1 = BONE.get(ctx.confidential_store()).unwrap_or_default();
        let b0 = BZERO.get(ctx.confidential_store()).unwrap_or_default();
        let result = b0 + b1 * input;

        result
    }  

    fn set_coefficient<C: sdk::Context>(ctx: &mut C, b0: i32, b1: i32){
        BZERO.set(ctx.confidential_store(), b0);
        BONE.set(ctx.confidential_store(), b1);
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

                // get mean
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

                // get variance
                sum1 = 0;
                for i in 0..x.len() {
                    sum1 += (x[i] - xmean).pow(2);
                }
                let xvar = sum1;

                // get covariance
                let mut sum = 0;
                for i in 0..x.len() {
                    sum += (x[i] - xmean) * (y[i] - ymean);
                }
                let covar = sum;

                // get coefficient
                let b1 = covar / xvar;
                let b0 = ymean - b1 * xmean;

                // need to be confidentially stored
                Self::set_coefficient(ctx, b0, b1);
                Ok(Response::Hello {
                    greeting: format!("coefficient calculation completes"),
                })
            },
            Request::Predict { input } => {
                let result = Self::predict_result(ctx, input);
                Ok(Response::Hello {
                    greeting: format!("The result is {result}"),
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
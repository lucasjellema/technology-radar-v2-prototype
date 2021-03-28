export {isOperationBlackedOut, uuidv4, getNestedPropertyValueFromObject, setNestedPropertyValueFromObject}


// to prevent an operation from being executed too often, we record a timestamp in the near future until when 
// the operation cannot be executed; the function isOperationBlackedOut checks if the operation is currently blacked out and sets a new blackout end in the map
const blackoutMap = {} // records end of blackout timestamps under specific keys
const blackoutPeriodDefault = 100 // milliseconds
const isOperationBlackedOut = ( blackoutKey, blackoutPeriod = blackoutPeriodDefault) => {
   let isBlackedout = false
   const blackoutDeadline = blackoutMap[blackoutKey]
   const now = new Date().getTime() 
   if (blackoutDeadline != null)  
      isBlackedout = now < blackoutDeadline 
   if (!isBlackedout)  
      blackoutMap[blackoutKey] = now + blackoutPeriod // set fresh blackout if currently not blacked out 
   return isBlackedout
}


const  uuidv4= ()=>  {
   return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
     (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
   );
 }

 // also see: https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path
 const getNestedPropertyValueFromObject = (object, propertyPath) => {
   const propertyPathSegments = propertyPath.split('.')
   let value = object
   for (let i=0;i<propertyPathSegments.length;i++) {
       value = value[propertyPathSegments[i]]
   }
   return value
}

const setNestedPropertyValueFromObject = (object, propertyPath , value) => {    
   const propertyPathSegments = propertyPath.split('.')
   let elementToSet = object
   for (let i=0;i<propertyPathSegments.length-1;i++) {
       elementToSet = elementToSet[propertyPathSegments[i]]
   }
   elementToSet[propertyPathSegments[propertyPathSegments.length-1]] = value
   return object
}